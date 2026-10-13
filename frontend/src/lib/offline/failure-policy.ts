import { isAxiosError } from "axios";

import { parseProblem } from "@/lib/api/problem-details";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

/** Resending can never succeed for these, so the queued entry is dropped. */
const PERMANENT_STATUSES = new Set([400, 404, 409, 413, 422]);

export const CARD_LIMIT_MESSAGE = "Dosegnut je najveći broj kartica.";

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

/** The toast for a failed card write, or null when the failure needs no message. */
export function cardWriteMessage(error: unknown): string | null {
  const status = httpStatus(error);

  // The card was deleted elsewhere; the invalidation that follows removes it here too.
  if (status === 404) return null;

  if (status === 409) {
    const detail = parseProblem(error)?.detail ?? "";
    // Other conflicts mean the write already landed, so there is nothing to tell.
    return /najveći broj kartica/i.test(detail) ? CARD_LIMIT_MESSAGE : null;
  }

  return "Kartica nije spremljena. Pokušaj ponovno.";
}
