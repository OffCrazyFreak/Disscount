// The public DSN is baked in at build time per environment (changing it needs a
// redeploy) and no-ops cleanly when unset.
import * as Sentry from "@sentry/nextjs";

import { isServiceWorkerRegistrationNoise } from "@/lib/sentry/ignore-service-worker-noise";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // List ids reach Sentry unscrubbed by decision, recorded in docs/SHARING.md. Replay is
  // not covered by that: it records the DOM, so a shared list's contents would go with it.
  integrations: [
    Sentry.replayIntegration({
      beforeAddRecordingEvent: (event) =>
        window.location.pathname.startsWith("/shopping-lists/") ? null : event,
    }),
  ],

  beforeSend: (event) =>
    isServiceWorkerRegistrationNoise(event) ? null : event,

  // 100% of traces in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  // Session Replay: 1% of sessions, 100% of sessions with an error. The two rates are
  // decided in sequence rather than independently: the session one runs first, and the
  // error buffer only applies to the sessions it skipped. So the session rate is the one
  // that spends quota on sessions where nothing went wrong.
  // At 10% it exhausted the plan's 50 replays mid-period and every later replay
  // was dropped, error ones included. 1% keeps enough healthy sessions for the replay-derived
  // detectors (hydration errors, rage and dead clicks) without crowding out the error path.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  // App is privacy-conscious (EU/DE) - keep IPs/headers/user data out of events by default.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
