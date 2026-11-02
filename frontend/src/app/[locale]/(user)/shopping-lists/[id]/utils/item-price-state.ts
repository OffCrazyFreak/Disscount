import type { QueryObserverResult } from "@tanstack/react-query";

import { httpStatus } from "@/lib/offline/failure-policy";

/** Where one list item's live prices stand, so its row can say why it has no store choice. */
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

/** The `shoppingListDetail` key a row shows in place of a store choice it cannot offer. */
export const UNAVAILABLE_PRICE_KEYS = {
  loading: undefined,
  ready: undefined,
  failed: "prices.failed",
  offline: "prices.offline",
  noPrices: "prices.noPrices",
} as const satisfies Record<ItemPriceState, string | undefined>;

/** Whether a state is a lookup's answer worth remembering through its next refetch. */
export function isSettledLookupError(state: ItemPriceState): boolean {
  return state === "failed" || state === "noPrices";
}

/**
 * The state of a product lookup that has no data to show yet. `lastError` is the answer it
 * settled on before, since a refetch from any observer clears the error until it answers.
 */
export function lookupPriceState(
  lookup: ProductLookup,
  lastError: ItemPriceState | undefined,
): ItemPriceState {
  // React Query pauses a fetch it cannot send offline, and nothing was saved to show instead.
  if (lookup.fetchStatus === "paused") return "offline";
  // The row, the banner and its button stay put until the refetch actually answers.
  if (lookup.errorUpdatedAt > 0 && lookup.fetchStatus === "fetching") {
    return lastError ?? "failed";
  }
  if (lookup.status === "error") {
    return isProductNotFound(lookup.error) ? "noPrices" : "failed";
  }

  return "loading";
}

/**
 * An item's state from its own lookup. `storePrices` is undefined until the product loads,
 * and a bought item keeps the prices saved with it, so its live lookup no longer matters.
 */
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
