// Throws at module load, so a misconfigured deploy fails on boot, not per request.
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function toTrustedOrigin(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`NEXT_PUBLIC_APP_URL is not a valid URL: ${value}`);
  }

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
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return toTrustedOrigin(configured);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_APP_URL",
    );
  }

  return "http://localhost:3000";
}
