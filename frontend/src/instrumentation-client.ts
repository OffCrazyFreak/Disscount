// The public DSN is baked in at build time per environment (changing it needs a
// redeploy) and no-ops cleanly when unset.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.replayIntegration()],

  // 100% of traces in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  // Session Replay: 10% of sessions, 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // App is privacy-conscious (EU/DE) - keep IPs/headers/user data out of events by default.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
