// Reads a required server env var, throwing at module load if it's missing so a
// misconfigured deploy fails fast on boot instead of silently at request time.
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
