const PRODUCTION_ORIGIN = "https://disscount.me";

// Dev and preview deploys mirror production content, so only the real domain may be indexed.
export function isIndexableOrigin(appUrl: string | undefined): boolean {
  if (!appUrl) return false;

  try {
    return new URL(appUrl).origin === PRODUCTION_ORIGIN;
  } catch {
    return false;
  }
}
