import { isAxiosError } from "axios";

import { parseProblem } from "@/lib/api/problem-details";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

/** Resending can never succeed for these, so the queued entry is dropped. */
const PERMANENT_STATUSES = new Set([400, 404, 409, 413, 422]);

export type CardWriteMessageKey =
  "offline.cardLimit" | "offline.cardSaveFailed";

export const CARD_LIMIT_KEY = "offline.cardLimit";

/**
 * "keep": a later attempt can succeed (offline, signed out, throttled, server trouble),
 * so the entry stays queued and the replay stops. "drop": the server refused it for good.
 * Statuses outside the permanent set also keep, so an unexpected answer never loses a photo.
 */
export function failureAction(error: unknown): "keep" | "drop" {
  if (isNetworkFailure(error)) return "keep";

  const status = httpStatus(error);
  return status !== undefined && PERMANENT_STATUSES.has(status)
    ? "drop"
    : "keep";
}

/** The HTTP status itself, since a 404 from a proxy carries no Problem Details body. */
export function httpStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** The `digitalCards` message key for a failed card write, or null when the failure needs no toast. */
export function cardWriteMessage(error: unknown): CardWriteMessageKey | null {
  const status = httpStatus(error);

  // The card was deleted elsewhere; the invalidation that follows removes it here too.
  if (status === 404) return null;

  if (status === 409) {
    // Other conflicts mean the write already landed, so there is nothing to tell.
    return parseProblem(error)?.code === "error.card.limitReached"
      ? CARD_LIMIT_KEY
      : null;
  }

  return "offline.cardSaveFailed";
}
