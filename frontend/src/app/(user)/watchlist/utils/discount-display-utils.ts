import { getChainLabel } from "@/utils/labels";
import { formatPriceDelta } from "@/utils/price";
import { IScopedDiscountedStore } from "@/app/(user)/watchlist/typings/watchlist-types";
import type { INotificationStore } from "@/context/notifications-types";

export function toStoreLines(
  stores: IScopedDiscountedStore[],
): INotificationStore[] {
  return stores.map((store) => ({
    chainName: getChainLabel(store.chain.chain),
    currentPrice: store.currentPrice,
    discountAmount: store.discountAmount,
    discountPercentage: store.discountPercentage,
  }));
}

export function formatDifference(
  difference: number | null,
  percentage: number | null,
  fallback: string,
): string {
  if (difference === null || percentage === null) {
    return fallback;
  }

  return formatPriceDelta(difference, percentage);
}
