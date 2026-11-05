import * as Sentry from "@sentry/nextjs";

function digestOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }

  return typeof error.digest === "string" ? error.digest : undefined;
}

/**
 * Reports an error that reached an error boundary. The digest links a
 * server-rendered error to its server-side event, so it goes in as a tag. Only a
 * boundary's componentDidCatch sees the component stack; Sentry links it as a cause.
 */
export function captureBoundaryError(error: unknown, componentStack?: string) {
  const digest = digestOf(error);
  const hint = digest ? { tags: { digest } } : undefined;

  if (componentStack) {
    Sentry.captureReactException(error, { componentStack }, hint);
  } else {
    Sentry.captureException(error, hint);
  }
}
