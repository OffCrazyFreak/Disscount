import type { QueryObserverResult } from "@tanstack/react-query";

import { httpStatus } from "@/lib/offline/failure-policy";

/** Where one list item's live prices stand, so its row can say why it has no store choice. */
export type ItemPriceState =
  "loading" | "ready" | "failed" | "offline" | "noPrices";

type ProductLookup = Pick<
  QueryObserverResult<unknown, unknown>,
  "status" | "fetchStatus" | "error"
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

/** The state of a product lookup that has no data to show yet. */
export function lookupPriceState(
  lookup: ProductLookup,
  isRetried: boolean,
): ItemPriceState {
  // React Query pauses a fetch it cannot send offline, and nothing was saved to show instead.
  if (lookup.fetchStatus === "paused") return "offline";
  // A refetch resets a never-loaded query to pending, but the banner and its button must stay put.
  if (isRetried && lookup.fetchStatus === "fetching") return "failed";
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
