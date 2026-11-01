import { failureAction } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

const MAX_DELAY_MS = 30_000;

// Five attempts, about 15 seconds, before the failure reaches the form that can reopen.
const MAX_LIVE_HTTP_RETRIES = 4;

/**
 * A failure that can pass is retried for as long as the page stays open, since a dropped
 * replay would lose the card write; TanStack itself pauses retries while offline.
 */
export function shouldRetryCardWrite(_failureCount: number, error: unknown) {
  return failureAction(error) === "keep";
}

// Bounded because only paused mutations persist, and the caller still holds what was typed.
export function shouldRetryLiveCardWrite(failureCount: number, error: unknown) {
  if (isNetworkFailure(error)) return true;

  return (
    shouldRetryCardWrite(failureCount, error) &&
    failureCount < MAX_LIVE_HTTP_RETRIES
  );
}

export function cardRetryDelay(failureCount: number) {
  return Math.min(1000 * 2 ** failureCount, MAX_DELAY_MS);
}

// Hook options override the replay defaults, so a write restored from disk keeps retrying.
export const LIVE_CARD_RETRY = {
  retry: shouldRetryLiveCardWrite,
  retryDelay: cardRetryDelay,
};
