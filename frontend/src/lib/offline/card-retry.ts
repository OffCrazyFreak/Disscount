import { isSessionChanged } from "@/lib/api/problem-details";
import { failureAction } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

const MAX_DELAY_MS = 30_000;

// Five attempts, about 15 seconds, then the failure surfaces: the form reopens with what was typed, or a replay toast names what failed.
const MAX_HTTP_RETRIES = 4;

/** Network failures retry while the page is open since writes persist; never after session_changed, which would save one account's write into the other. */
export function shouldRetryCardWrite(failureCount: number, error: unknown) {
  if (isNetworkFailure(error)) return true;

  return (
    !isSessionChanged(error) &&
    failureAction(error) === "keep" &&
    failureCount < MAX_HTTP_RETRIES
  );
}

export function cardRetryDelay(failureCount: number) {
  return Math.min(1000 * 2 ** failureCount, MAX_DELAY_MS);
}

export const CARD_WRITE_RETRY = {
  retry: shouldRetryCardWrite,
  retryDelay: cardRetryDelay,
};
