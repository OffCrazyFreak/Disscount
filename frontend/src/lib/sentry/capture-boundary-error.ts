import * as Sentry from "@sentry/nextjs";

function digestOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }

  return typeof error.digest === "string" ? error.digest : undefined;
}

/**
 * Reports an error that reached a route error boundary. The digest links a
 * server-rendered error to its server-side event, so it goes in as a tag.
 */
export function captureBoundaryError(error: unknown) {
  const digest = digestOf(error);
  Sentry.captureException(error, digest ? { tags: { digest } } : undefined);
}
