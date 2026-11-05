import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  IWatchlistPriceSnapshot,
  WatchlistPriceSnapshot,
} from "@/typings/local-storage";
import { calculateDiscountInfo } from "@/lib/watchlist/watchlist-discount-utils";

/** Whole cents, so float noise never reads as a drop. */
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

export function getPriceScope(pinnedStoreChainCodes: string[]): string {
  return [...new Set(pinnedStoreChainCodes)].sort().join(",");
}

export function countPriceDrops(
  currentPrices: WatchlistPriceSnapshot,
  snapshot: IWatchlistPriceSnapshot | null,
  scope: string,
): number {
  if (!snapshot || snapshot.scope !== scope) return 0;

  const saved = snapshot.prices;

  return Object.entries(currentPrices).filter(
    ([ean, price]) => saved[ean] !== undefined && price < saved[ean],
  ).length;
}

/** Without a loaded price a product keeps its baseline; unwatched ones drop so re-watching starts fresh. */
export function nextPriceSnapshot(
  currentPrices: WatchlistPriceSnapshot,
  snapshot: IWatchlistPriceSnapshot | null,
  scope: string,
  watchedEans: string[],
  isVisit: boolean,
): IWatchlistPriceSnapshot {
  const isSameScope = snapshot?.scope === scope;
  const saved = isSameScope ? snapshot.prices : {};
  const isRebase = isVisit || !isSameScope;
  const prices: WatchlistPriceSnapshot = {};

  for (const ean of watchedEans) {
    const price = isRebase
      ? (currentPrices[ean] ?? saved[ean])
      : (saved[ean] ?? currentPrices[ean]);

    if (price !== undefined) prices[ean] = price;
  }

  return { scope, prices };
}

export function isSameSnapshot(
  left: IWatchlistPriceSnapshot,
  right: IWatchlistPriceSnapshot | null,
): boolean {
  if (!right || left.scope !== right.scope) return false;

  const eans = Object.keys(left.prices);

  return (
    eans.length === Object.keys(right.prices).length &&
    eans.every((ean) => left.prices[ean] === right.prices[ean])
  );
}
