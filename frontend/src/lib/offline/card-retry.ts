import { isSessionChanged } from "@/lib/api/problem-details";
import { failureAction } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

const MAX_DELAY_MS = 30_000;

// Five attempts, about 15 seconds, then the form reopens or a replay toast names the failure.
const MAX_HTTP_RETRIES = 4;

/** Never after session_changed, which would save one account's write into the other. */
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
