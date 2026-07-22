// Reads a required server env var, throwing at module load if it's missing so a
// misconfigured deploy fails fast on boot instead of silently at request time.
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Public app origin. Required in production (fail closed, never leak localhost); localhost in dev.
export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_APP_URL",
    );
  }

  return "http://localhost:3000";
}
