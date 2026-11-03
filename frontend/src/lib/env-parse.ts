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

function describeIssues(issues: z.core.$ZodIssue[]): string {
  return issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

// Checked one key at a time, so a read fails only on the variable it needs.
export function parseEnvValue<T extends z.ZodObject>(
  schema: T,
  key: string,
  raw: RawEnv,
): unknown {
  const field: z.ZodType | undefined = schema.shape[key];
  if (!field) return undefined;

  const result = field.safeParse(withoutEmptyStrings(raw)[key]);
  if (result.success) return result.data;

  const reasons = result.error.issues.map((issue) => issue.message);
  throw new Error(`Invalid environment variable ${key}: ${reasons.join("; ")}`);
}

export function validateEnv<T extends z.ZodObject>(
  schema: T,
  raw: RawEnv,
): void {
  const result = schema.safeParse(withoutEmptyStrings(raw));
  if (result.success) return;

  throw new Error(
    `Invalid environment variables:\n${describeIssues(result.error.issues)}`,
  );
}
