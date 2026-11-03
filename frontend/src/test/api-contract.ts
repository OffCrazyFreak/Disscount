import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { z } from "zod";

interface IJsonSchema {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  pattern?: string;
  properties?: Record<string, IJsonSchema>;
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

  const backendValues = allowedValues(backend);
  if (!frontend.enum || !backendValues) return undefined;
  return isSameSet(frontend.enum, backendValues)
    ? undefined
    : `backend [${backendValues}], zod [${frontend.enum}]`;
}

function fieldDrift(
  contract: IApiContract,
  path: string,
  backendFields: Record<string, IJsonSchema>,
  frontendFields: Record<string, IJsonSchema>,
) {
  const drift: Record<string, string> = {};
  for (const field of Object.keys({ ...backendFields, ...frontendFields })) {
    const fieldPath = `${path}.${field}`;
    if (!backendFields[field]) drift[fieldPath] = "only in the zod schema";
    else if (!frontendFields[field]) drift[fieldPath] = "only in the backend";
    else {
      Object.assign(
        drift,
        findDrift(
          contract,
          fieldPath,
          backendFields[field],
          frontendFields[field],
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

/** Every path where the backend's schema and the zod schema disagree, each with what differs. */
export function findDrift(
  contract: IApiContract,
  path: string,
  backendSchema: IJsonSchema,
  zodSchema: IJsonSchema,
): Record<string, string> {
  const backend = backendSchema.$ref
    ? contract.schemas[backendSchema.$ref.split("/").at(-1) ?? ""]
    : backendSchema;
  const frontend = withoutNull(zodSchema);

  // A union such as "completed or skipped:<n>" states a rule, not one shape to compare.
  if (frontend.anyOf) return {};

  const scalar = scalarDrift(backend, frontend);
  const { items: backendItems, additionalProperties: backendMap } = backend;
  const { items: frontendItems, additionalProperties: frontendMap } = frontend;

  return {
    ...(scalar && { [path]: scalar }),
    ...(backend.properties &&
      frontend.properties &&
      fieldDrift(contract, path, backend.properties, frontend.properties)),
    ...(backendItems &&
      frontendItems &&
      findDrift(contract, `${path}[]`, backendItems, frontendItems)),
    ...(isSchema(backendMap) &&
      isSchema(frontendMap) &&
      findDrift(contract, `${path}{}`, backendMap, frontendMap)),
  };
}
