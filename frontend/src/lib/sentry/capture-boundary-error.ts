import * as Sentry from "@sentry/nextjs";

function digestOf(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return undefined;
  }

  return typeof error.digest === "string" ? error.digest : undefined;
}

/** The digest links a server error to its event; only componentDidCatch sees the component stack. */
export function captureBoundaryError(error: unknown, componentStack?: string) {
  const digest = digestOf(error);
  const hint = digest ? { tags: { digest } } : undefined;

  if (componentStack) {
    Sentry.captureReactException(error, { componentStack }, hint);
  } else {
    Sentry.captureException(error, hint);
  }
}
