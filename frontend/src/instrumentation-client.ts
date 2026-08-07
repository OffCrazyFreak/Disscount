// The public DSN is baked in at build time per environment (changing it needs a
// redeploy) and no-ops cleanly when unset.
import * as Sentry from "@sentry/nextjs";

import { isServiceWorkerRegistrationNoise } from "@/lib/sentry/ignore-service-worker-noise";
import {
  scrubCrumbData,
  scrubEventUrls,
  scrubShareToken,
} from "@/lib/sentry/scrub-share-token";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay masks text by default but not URLs, and its envelopes do not pass through
  // beforeSend, so the scrubbing below does not reach them. Shared-list pages are
  // excluded from recording instead.
  integrations: [
    Sentry.replayIntegration({
      beforeAddRecordingEvent: (event) =>
        window.location.pathname.startsWith("/s/") ? null : event,
    }),
  ],

  beforeSend: (event) =>
    isServiceWorkerRegistrationNoise(event) ? null : scrubEventUrls(event),
  beforeSendTransaction: scrubEventUrls,
  beforeBreadcrumb(breadcrumb) {
    breadcrumb.message = scrubShareToken(breadcrumb.message);
    if (breadcrumb.data) breadcrumb.data = scrubCrumbData(breadcrumb.data);
    return breadcrumb;
  },

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
