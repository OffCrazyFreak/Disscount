import { z } from "zod";

import { httpUrl, parseEnvValue, validateEnv } from "./env-parse";

const optionalFlag = z
  .string()
  .optional()
  .transform((value) => value === "true");

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: httpUrl.default("http://localhost:8080"),
  NEXT_PUBLIC_APP_URL: httpUrl.optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: httpUrl.optional(),
  NEXT_PUBLIC_ENABLE_REACT_SCAN: optionalFlag,
  NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS: optionalFlag,
  // Not NEXT_PUBLIC, but next.config.ts inlines it through `env` for the browser Sentry init.
  SENTRY_ENVIRONMENT: z.string().optional(),
});

type ClientEnv = z.infer<typeof clientEnvSchema>;

// Next inlines only literal `process.env.NEXT_PUBLIC_X` reads into the client bundle, so each
// key is spelled out; getters read at access time, as the raw reads they replace did.
function readClientEnv(): Record<keyof ClientEnv, string | undefined> {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ENABLE_REACT_SCAN: process.env.NEXT_PUBLIC_ENABLE_REACT_SCAN,
    NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS:
      process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
  };
}

export const clientEnv = new Proxy({} as ClientEnv, {
  get(_, key: string) {
    return parseEnvValue(clientEnvSchema, key, readClientEnv());
  },
});

export function validateClientEnv(): void {
  validateEnv(clientEnvSchema, readClientEnv());
}

function toTrustedOrigin(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_APP_URL must use http or https: ${value}`);
  }

  if (url.username || url.password) {
    throw new Error("NEXT_PUBLIC_APP_URL must not contain credentials");
  }

  return url.origin;
}

// Public app origin. Required in production (fail closed, never leak localhost); localhost in dev.
export function appUrl(): string {
  const configured = clientEnv.NEXT_PUBLIC_APP_URL;
  if (configured) return toTrustedOrigin(configured);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_APP_URL",
    );
  }

  return "http://localhost:3000";
}
