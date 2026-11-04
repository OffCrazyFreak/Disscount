import type { QueryObserverResult } from "@tanstack/react-query";

import { httpStatus } from "@/lib/offline/failure-policy";

export type ItemPriceState =
  "loading" | "ready" | "failed" | "offline" | "noPrices";

type ProductLookup = Pick<
  QueryObserverResult<unknown, unknown>,
  "status" | "fetchStatus" | "error" | "errorUpdatedAt"
>;

/** Upstream answers 404 for an EAN it does not carry, which no retry can change. */
export function isProductNotFound(error: unknown): boolean {
  return httpStatus(error) === 404;
}

export const PRICE_STATUS_BANNER_ID = "shopping-list-price-status";

export const UNAVAILABLE_PRICE_KEYS = {
  loading: undefined,
  ready: undefined,
  failed: "prices.failed",
  offline: "prices.offline",
  noPrices: "prices.noPrices",
} as const satisfies Record<ItemPriceState, string | undefined>;

export function isSettledLookupError(state: ItemPriceState): boolean {
  return state === "failed" || state === "noPrices";
}

/** `lastError` is the answer it settled on before, since a refetch from any observer clears the error until it answers. */
export function lookupPriceState(
  lookup: ProductLookup,
  lastError: ItemPriceState | undefined,
): ItemPriceState {
  // The row and banner stay put until the refetch answers, even when paused offline, so a retry without a connection keeps focus where it was.
  if (lookup.errorUpdatedAt > 0 && lookup.fetchStatus !== "idle") {
    return lastError ?? "failed";
  }
  // React Query pauses a fetch it cannot send offline, and nothing was saved to show instead.
  if (lookup.fetchStatus === "paused") return "offline";
  if (lookup.status === "error") {
    return isProductNotFound(lookup.error) ? "noPrices" : "failed";
  }

  return "loading";
}

/** A bought item keeps the prices saved with it, so its live lookup no longer matters. */
export function itemPriceState(
  isChecked: boolean,
  lookupState: ItemPriceState | undefined,
  storePrices: Record<string, number> | undefined,
): ItemPriceState {
  if (isChecked) return "ready";
  if (storePrices) {
    return Object.keys(storePrices).length > 0 ? "ready" : "noPrices";
  }

  return lookupState ?? "loading";
}
