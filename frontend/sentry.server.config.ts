// Sentry server (Node) init. Reuses the public DSN env var (same Sentry project as the
// client), baked in at build time per environment; no-ops when unset.
import * as Sentry from "@sentry/nextjs";

import { clientEnv } from "@/lib/env";
import { sentryScrubbingOptions } from "@/lib/sentry/scrub-sensitive-data";

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,

  environment: clientEnv.SENTRY_ENVIRONMENT,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  sendDefaultPii: false,

  ...sentryScrubbingOptions,
});
