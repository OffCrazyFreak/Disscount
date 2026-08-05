// The public DSN is baked in at build time per environment (changing it needs a
// redeploy) and no-ops cleanly when unset.
import * as Sentry from "@sentry/nextjs";

import {
  scrubCrumbData,
  scrubEventUrls,
  scrubShareToken,
} from "@/lib/sentry/scrub-share-token";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay masks text by default but not URLs, so a navigation to a shared list would
  // otherwise carry a working capability token into the recording.
  integrations: [Sentry.replayIntegration()],

  beforeSend: scrubEventUrls,
  beforeSendTransaction: scrubEventUrls,
  beforeBreadcrumb(breadcrumb) {
    breadcrumb.message = scrubShareToken(breadcrumb.message);
    if (breadcrumb.data) breadcrumb.data = scrubCrumbData(breadcrumb.data);
    return breadcrumb;
  },

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
