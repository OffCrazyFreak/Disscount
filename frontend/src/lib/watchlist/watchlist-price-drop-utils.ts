import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { WatchlistPriceSnapshot } from "@/typings/local-storage";
import { calculateDiscountInfo } from "@/lib/watchlist/watchlist-discount-utils";

/**
 * The cheapest chain price inside the user's scope (their pinned stores' chains when they
 * have any, otherwise every chain), in whole cents so float noise never reads as a drop.
 */
export function getScopedBestPriceCents(
  product: ProductResponse,
  pinnedStoreChainCodes: string[],
): number | null {
  const discountInfo = calculateDiscountInfo(product, pinnedStoreChainCodes);
  const bestPrice =
    pinnedStoreChainCodes.length > 0
      ? discountInfo.preferredMinPrice
      : discountInfo.totalMinPrice;

  return bestPrice === null ? null : Math.round(bestPrice * 100);
}

/** Watched EANs whose price is now below the one saved for them. */
export function countPriceDrops(
  currentPrices: WatchlistPriceSnapshot,
  snapshot: WatchlistPriceSnapshot,
): number {
  return Object.entries(currentPrices).filter(
    ([ean, price]) => snapshot[ean] !== undefined && price < snapshot[ean],
  ).length;
}

/**
 * A visit resets every baseline to today's price and forgets products no longer watched.
 * Otherwise only products seen for the first time get a baseline, so a later drop counts.
 * A product whose price did not load keeps its old baseline: no data is not a new price.
 */
export function nextPriceSnapshot(
  currentPrices: WatchlistPriceSnapshot,
  snapshot: WatchlistPriceSnapshot,
  watchedEans: string[],
  isVisit: boolean,
): WatchlistPriceSnapshot {
  if (!isVisit) return { ...currentPrices, ...snapshot };

  const next: WatchlistPriceSnapshot = {};

  for (const ean of watchedEans) {
    const price = currentPrices[ean] ?? snapshot[ean];
    if (price !== undefined) next[ean] = price;
  }

  return next;
}

export function isSameSnapshot(
  left: WatchlistPriceSnapshot,
  right: WatchlistPriceSnapshot,
): boolean {
  const leftKeys = Object.keys(left);

  return (
    leftKeys.length === Object.keys(right).length &&
    leftKeys.every((ean) => left[ean] === right[ean])
  );
}
