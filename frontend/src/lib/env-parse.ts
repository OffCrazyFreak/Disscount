import { z } from "zod";

export const httpUrl = z.url({ protocol: /^https?$/ });

type RawEnv = Record<string, string | undefined>;

// Docker passes an unset build arg through as "", which means "not configured", not a value.
function withoutEmptyStrings(raw: RawEnv): RawEnv {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
}

// zod reports an unset variable as "expected string, received undefined", which hides the cause.
function describeIssue(issue: z.core.$ZodIssue, value: unknown): string {
  return value === undefined ? "is required" : issue.message;
}

// Checked one key at a time, so a read fails only on the variable it needs.
export function parseEnvValue<T extends z.ZodObject>(
  schema: T,
  key: string,
  raw: RawEnv,
): unknown {
  // Object.prototype keys (toString, constructor) are not variables.
  if (!Object.hasOwn(schema.shape, key)) return undefined;

  const value = withoutEmptyStrings(raw)[key];
  const field: z.ZodType = schema.shape[key];
  const result = field.safeParse(value);
  if (result.success) return result.data;

  const reasons = result.error.issues.map((issue) =>
    describeIssue(issue, value),
  );
  throw new Error(`Invalid environment variable ${key}: ${reasons.join("; ")}`);
}

export function validateEnv<T extends z.ZodObject>(
  schema: T,
  raw: RawEnv,
): void {
  const env = withoutEmptyStrings(raw);
  const result = schema.safeParse(env);
  if (result.success) return;

  const lines = result.error.issues.map((issue) => {
    const key = issue.path.join(".");
    return `  ${key}: ${describeIssue(issue, env[key])}`;
  });
  throw new Error(`Invalid environment variables:\n${lines.join("\n")}`);
}
