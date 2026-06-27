// Sentry edge init (middleware, edge routes). Reuses the public DSN env var; no-ops when unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: false,
});
