import { failureAction } from "@/lib/offline/failure-policy";

const MAX_RETRIES = 3;

/** Only failures that can pass are retried; TanStack itself pauses retries while offline. */
export function shouldRetryCardWrite(failureCount: number, error: unknown) {
  return failureCount < MAX_RETRIES && failureAction(error) === "keep";
}

export const cardRetryDelay = (failureCount: number) =>
  Math.min(1000 * 2 ** failureCount, 8000);
