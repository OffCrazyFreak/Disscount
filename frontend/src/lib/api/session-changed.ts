import { authClient } from "@/lib/auth/client";
import { isSessionChanged } from "@/lib/api/problem-details";

/**
 * After a session_changed refusal, refetching the session lets UserProvider switch the cache identity and purge, after which
 * calls carry the new pin. A refetch already running is aborted by better-auth for the newer one.
 */
export function refetchSessionIfChanged(error: unknown) {
  if (!isSessionChanged(error)) return;

  authClient.$store.notify("$sessionSignal");
}
