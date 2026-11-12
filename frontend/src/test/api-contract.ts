import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import {
  acceptsNull,
  NULLABILITY,
  nullabilityDrift,
  type WireDirection,
} from "@/test/nullability-drift";

export interface IJsonSchema {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  pattern?: string;
  properties?: Record<string, IJsonSchema>;
  required?: string[];
  items?: IJsonSchema;
  additionalProperties?: IJsonSchema | boolean;
  anyOf?: IJsonSchema[];
}

export interface IApiContract {
  schemas: Record<string, IJsonSchema>;
  enums: Record<string, string[]>;
}

/** Read at runtime: the frontend image builds without the repository root, so an import would break its type check. */
export function readApiContract(): IApiContract {
  const file = new URL("../../../contracts/backend-api.json", import.meta.url);

  return JSON.parse(readFileSync(fileURLToPath(file), "utf8")) as IApiContract;
}

// The input side, because that is what crosses the wire; a transform has no JSON form of its own.
export function describeZodSchema(schema: z.ZodType): IJsonSchema {
  return z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as IJsonSchema;
}

function withoutNull(schema: IJsonSchema): IJsonSchema {
  if (Array.isArray(schema.type)) {
    const [type] = schema.type.filter((candidate) => candidate !== "null");
    return { ...schema, type };
  }

  const branches = schema.anyOf?.filter((branch) => branch.type !== "null");
  return branches?.length === 1 ? withoutNull(branches[0]) : schema;
}

function isSameSet(left: unknown[], right: unknown[]): boolean {
  const leftSet = new Set(left);
  return (
    leftSet.size === new Set(right).size &&
    right.every((value) => leftSet.has(value))
  );
}

// DigitalCardRequest validates its card and code types with an alternation regex, not an enum.
function allowedValues(schema: IJsonSchema): unknown[] | undefined {
  if (schema.enum) return schema.enum;
  return /^\w+(\|\w+)+$/.test(schema.pattern ?? "")
    ? schema.pattern?.split("|")
    : undefined;
}

function scalarDrift(backend: IJsonSchema, frontend: IJsonSchema) {
  const isCompatibleType =
    !backend.type ||
    !frontend.type ||
    backend.type === frontend.type ||
    (backend.type === "integer" && frontend.type === "number");
  if (!isCompatibleType) return `backend ${backend.type}, zod ${frontend.type}`;

  if (!frontend.enum) return undefined;
  const backendValues = allowedValues(backend);
  if (!backendValues) return "zod enum, backend states no values";
  return isSameSet(frontend.enum, backendValues)
    ? undefined
    : `backend [${backendValues}], zod [${frontend.enum}]`;
}

function fieldDrift(
  contract: IApiContract,
  path: string,
  backend: IJsonSchema,
  frontend: IJsonSchema,
  direction: WireDirection,
) {
  const backendFields = backend.properties ?? {};
  const frontendFields = frontend.properties ?? {};
  const drift: Record<string, string> = {};

  for (const field of Object.keys({ ...backendFields, ...frontendFields })) {
    const fieldPath = `${path}.${field}`;
    if (!backendFields[field]) drift[fieldPath] = "only in the zod schema";
    else if (!frontendFields[field]) drift[fieldPath] = "only in the backend";
    else {
      const nullability = nullabilityDrift(direction, {
        isBackendNullable: acceptsNull(backendFields[field]),
        isBackendRequired: backend.required?.includes(field) ?? false,
        isZodNullable: acceptsNull(frontendFields[field]),
        isZodOptional: !frontend.required?.includes(field),
      });
      if (nullability) drift[`${fieldPath}${NULLABILITY}`] = nullability;

      Object.assign(
        drift,
        findDrift(
          contract,
          fieldPath,
          backendFields[field],
          frontendFields[field],
          direction,
        ),
      );
    }
  }
  return drift;
}

function isSchema(
  value: IJsonSchema | boolean | undefined,
): value is IJsonSchema {
  return typeof value === "object";
}

export function findDrift(
  contract: IApiContract,
  path: string,
  backendSchema: IJsonSchema,
  zodSchema: IJsonSchema,
  direction: WireDirection,
): Record<string, string> {
  const backend = withoutNull(
    backendSchema.$ref
      ? contract.schemas[backendSchema.$ref.split("/").at(-1) ?? ""]
      : backendSchema,
  );
  const frontend = withoutNull(zodSchema);

  // Named rather than skipped, so a union can never hide a field or an enum unnoticed.
  if (frontend.anyOf) return { [path]: "zod union, not compared" };

  const scalar = scalarDrift(backend, frontend);
  const { items: backendItems, additionalProperties: backendMap } = backend;
  const { items: frontendItems, additionalProperties: frontendMap } = frontend;

  return {
    ...(scalar && { [path]: scalar }),
    ...(backend.properties &&
      frontend.properties &&
      fieldDrift(contract, path, backend, frontend, direction)),
    ...(backendItems &&
      frontendItems &&
      findDrift(contract, `${path}[]`, backendItems, frontendItems, direction)),
    ...(isSchema(backendMap) &&
      isSchema(frontendMap) &&
      findDrift(contract, `${path}{}`, backendMap, frontendMap, direction)),
  };
}
