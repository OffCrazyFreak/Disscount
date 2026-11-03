// The public DSN is baked in at build time per environment (changing it needs a
// redeploy) and no-ops cleanly when unset.
import * as Sentry from "@sentry/nextjs";

import { moveResetTokenOutOfUrl } from "@/lib/auth/reset-token-storage";
import { SENTRY_APPLICATION_KEY } from "@/lib/sentry/application-key";
import { isServiceWorkerRegistrationNoise } from "@/lib/sentry/ignore-service-worker-noise";
import {
  scrubSensitiveData,
  sentryScrubbingOptions,
} from "@/lib/sentry/scrub-sensitive-data";
import {
  isShoppingListPath,
  scrubBreadcrumbOnPage,
} from "@/lib/sentry/shopping-list-privacy";
import { clientEnv } from "@/lib/env";

const isResetTokenInUrl = moveResetTokenOutOfUrl();

Sentry.init({
  dsn: clientEnv.NEXT_PUBLIC_SENTRY_DSN,

  environment: clientEnv.SENTRY_ENVIRONMENT,

  integrations: [
    // Errors raised only by code outside our build (extensions, injected scripts) are not
    // ours to fix. Production only: dev bundles may lack the key, which would drop everything.
    ...(process.env.NODE_ENV === "production"
      ? [
          Sentry.thirdPartyErrorFilterIntegration({
            filterKeys: [SENTRY_APPLICATION_KEY],
            behaviour: "drop-error-if-exclusively-contains-third-party-frames",
          }),
        ]
      : []),
    // Replay records the page URL with no hook to scrub it, so a reset token that blocked
    // storage left in the URL keeps Replay off for this page load.
    ...(isResetTokenInUrl
      ? []
      : [
          Sentry.replayIntegration({
            // The shopping-lists layout blocks the list DOM itself; this hook only sees
            // Replay's breadcrumb and span events, so it drops those on list pages.
            beforeAddRecordingEvent: (event) =>
              isShoppingListPath(window.location.pathname)
                ? null
                : scrubSensitiveData(event),
          }),
        ]),
  ],

  ...sentryScrubbingOptions,

  beforeBreadcrumb: (breadcrumb) =>
    scrubBreadcrumbOnPage(breadcrumb, window.location.pathname),

  beforeSend: (event) =>
    isServiceWorkerRegistrationNoise(event) ? null : scrubSensitiveData(event),

  // 100% of traces in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

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

// Replay events carry the visited page URLs, and no before* hook sees them.
Sentry.addEventProcessor((event) =>
  event.type === "replay_event" ? scrubSensitiveData(event) : event,
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
