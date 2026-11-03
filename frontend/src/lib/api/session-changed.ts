import { isAxiosError } from "axios";

import { authClient } from "@/lib/auth/client";
import { SESSION_CHANGED } from "@/lib/backend-proxy/proxy-contract";
import { parseProblem } from "@/lib/api/problem-details";

/**
 * The proxy refused a call because the session cookie names another account than this tab.
 * Refetching the session lets UserProvider switch the cache identity and purge, after which
 * calls carry the new pin. A refetch already running is aborted by better-auth for the newer one.
 */
export function refetchSessionIfChanged(error: unknown) {
  if (!isAxiosError(error) || error.response?.status !== 401) return;
  if (parseProblem(error)?.code !== SESSION_CHANGED) return;

  authClient.$store.notify("$sessionSignal");
}
