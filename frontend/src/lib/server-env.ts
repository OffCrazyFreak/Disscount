import "server-only";

import { z } from "zod";

import { httpUrl, parseEnvValue, validateEnv } from "@/lib/env-parse";

const required = z.string().min(1);

export const serverEnvSchema = z.object({
  DATABASE_URL: required,
  BETTER_AUTH_URL: httpUrl,
  BETTER_AUTH_SECRET: required,
  // Read at runtime by better-auth, so it has to reach the container, not just the build.
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: required,
  GOOGLE_CLIENT_SECRET: required,
  FACEBOOK_CLIENT_ID: required,
  FACEBOOK_CLIENT_SECRET: required,
  RESEND_API_KEY: required,
  EMAIL_FROM: required,
  CIJENE_API_URL: httpUrl.default("https://api.cijene.dev"),
  CIJENE_API_TOKEN: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().optional(),
  GIT_SHA: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

// Read on access rather than once at import, so a module fails only on the variables it uses.
export const serverEnv = new Proxy({} as ServerEnv, {
  get(_, key: string) {
    return parseEnvValue(serverEnvSchema, key, process.env);
  },
});

export function validateServerEnv(): void {
  validateEnv(serverEnvSchema, process.env);
}
