import { failureAction } from "@/lib/offline/failure-policy";

const MAX_DELAY_MS = 30_000;

/**
 * A failure that can pass is retried for as long as the page stays open, since a dropped
 * replay would lose the card write; TanStack itself pauses retries while offline.
 */
export function shouldRetryCardWrite(_failureCount: number, error: unknown) {
  return failureAction(error) === "keep";
}

export function cardRetryDelay(failureCount: number) {
  return Math.min(1000 * 2 ** failureCount, MAX_DELAY_MS);
}
