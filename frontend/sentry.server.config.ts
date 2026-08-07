// Sentry server (Node) init. Reuses the public DSN env var (same Sentry project as the
// client); read at runtime so it can be set per-environment and no-ops when unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: false,
});
