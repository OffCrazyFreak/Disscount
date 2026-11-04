import { isAxiosError } from "axios";

import { authClient } from "@/lib/auth/client";
import { isSessionChanged } from "@/lib/api/problem-details";

// Outlasts a card write's retries (about 15 s), so one failing write refetches once.
const UNAUTHORIZED_REFETCH_WINDOW_MS = 30_000;

let lastUnauthorizedRefetchAt = Number.NEGATIVE_INFINITY;

/**
 * Every 401 here comes from Spring or the proxy: the session may have ended, so refetching lets
 * better-auth decide and UserProvider follow. After a session_changed refusal UserProvider switches
 * the cache identity and purges, after which calls carry the new pin. A refetch already running is
 * aborted by better-auth for the newer one.
 */
export function refetchSessionOnUnauthorized(error: unknown) {
  if (!isAxiosError(error) || error.response?.status !== 401) return;

  if (!isSessionChanged(error)) {
    const now = Date.now();
    if (now - lastUnauthorizedRefetchAt < UNAUTHORIZED_REFETCH_WINDOW_MS)
      return;
    lastUnauthorizedRefetchAt = now;
  }

  authClient.$store.notify("$sessionSignal");
}
