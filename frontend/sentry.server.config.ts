// Sentry server (Node) init. Reuses the public DSN env var (same Sentry project as the
// client); read at runtime so it can be set per-environment and no-ops when unset.
import * as Sentry from "@sentry/nextjs";

import { scrubEventUrls } from "@/lib/sentry/scrub-share-token";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // getSharedListPreview fetches /api/shared/<token> server-side for the link preview,
  // so the token reaches the server traces too.
  beforeSend: scrubEventUrls,
  beforeSendTransaction: scrubEventUrls,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enableLogs: true,

  sendDefaultPii: false,
});
