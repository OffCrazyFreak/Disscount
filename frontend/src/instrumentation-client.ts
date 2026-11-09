// First import, because later ones define Zod schemas at module scope.
import "@/lib/zod-jitless";
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
    // Errors only from outside code are not ours; production only, as dev bundles may lack the key.
    ...(process.env.NODE_ENV === "production"
      ? [
          Sentry.thirdPartyErrorFilterIntegration({
            filterKeys: [SENTRY_APPLICATION_KEY],
            behaviour: "drop-error-if-exclusively-contains-third-party-frames",
          }),
        ]
      : []),
    // Replay records the URL with no scrub hook, so a token left in it keeps Replay off for this load.
    ...(isResetTokenInUrl
      ? []
      : [
          Sentry.replayIntegration({
            // The layout blocks the list DOM; this hook drops breadcrumb and span events on list pages.
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

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 1% feeds replay-derived detectors; at 10% the plan's 50 replays ran out, dropping error replays too.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});

// Replay events carry the visited page URLs, and no before* hook sees them.
Sentry.addEventProcessor((event) =>
  event.type === "replay_event" ? scrubSensitiveData(event) : event,
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
