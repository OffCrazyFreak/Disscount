// Sentry edge init (middleware, edge routes). Reuses the public DSN env var; no-ops when unset.
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
