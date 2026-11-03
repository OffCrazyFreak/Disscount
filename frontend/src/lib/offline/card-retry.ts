import { isSessionChanged } from "@/lib/api/problem-details";
import { failureAction } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

const MAX_DELAY_MS = 30_000;

// Five attempts, about 15 seconds. Then the failure is surfaced: the form reopens with
// what was typed, or, for a write replayed from disk, a toast names what failed.
const MAX_HTTP_RETRIES = 4;

/**
 * No answer at all is retried for as long as the page stays open, since TanStack pauses
 * retries while offline and the paused write is persisted. A failure the server may get
 * over is bounded instead: a write in flight is persisted too, so a reload no longer
 * loses it and there is no reason to retry an outage forever. Never after
 * session_changed: a retry carries the new pin, so it would save one account's write
 * into the other.
 */
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
