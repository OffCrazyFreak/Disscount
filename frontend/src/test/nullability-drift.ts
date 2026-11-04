import type { IJsonSchema } from "@/test/api-contract";

export type WireDirection = "request" | "response";

export const NULLABILITY = " (null)";

interface IFieldState {
  isBackendNullable: boolean;
  isBackendRequired: boolean;
  isZodNullable: boolean;
  isZodOptional: boolean;
}

export function acceptsNull(schema: IJsonSchema): boolean {
  const { type, anyOf } = schema;
  const isNullType = Array.isArray(type)
    ? type.includes("null")
    : type === "null";

  return isNullType || (anyOf?.some(acceptsNull) ?? false);
}

// Spring serializes every key, so a response field is null or a value, and never absent.
function responseDrift(field: IFieldState): string | undefined {
  if (field.isBackendNullable && !field.isZodNullable) {
    return "backend sends null, zod rejects it";
  }
  if (!field.isBackendNullable && field.isZodNullable) {
    return "zod accepts null, backend never sends it";
  }
  return field.isZodOptional
    ? "zod lets the key go missing, backend always sends it"
    : undefined;
}

// Jackson reads an absent field and a null one alike, so a request's zod side may express "empty" either way.
function requestDrift(field: IFieldState): string | undefined {
  const canZodLeaveEmpty = field.isZodNullable || field.isZodOptional;

  if (field.isBackendRequired && canZodLeaveEmpty) {
    return "backend requires a value, zod can leave it empty";
  }
  if (field.isZodNullable && !field.isBackendNullable) {
    return "zod can send null, backend does not accept it";
  }
  return field.isBackendNullable && !canZodLeaveEmpty
    ? "backend accepts null, zod always demands a value"
    : undefined;
}

export function nullabilityDrift(
  direction: WireDirection,
  field: IFieldState,
): string | undefined {
  return direction === "response" ? responseDrift(field) : requestDrift(field);
}
