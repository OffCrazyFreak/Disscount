// Reads a required server env var, throwing early (at module load) if it's missing
// so misconfiguration fails fast instead of at request time.
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
