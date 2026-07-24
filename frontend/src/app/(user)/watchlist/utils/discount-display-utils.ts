import { getChainLabel } from "@/utils/labels";
import { isDiscountValueAboveThreshold } from "@/app/(user)/watchlist/utils/watchlist-utils";
import { IScopedDiscountedStore } from "@/app/(user)/watchlist/typings/watchlist-types";
import { WatchlistItemDto } from "@/lib/api/types";
import type { INotificationStore } from "@/context/notifications-types";

export function toStoreLines(
  stores: IScopedDiscountedStore[],
  watchlistItems: WatchlistItemDto[],
): INotificationStore[] {
  return stores.map((store) => ({
    chainName: getChainLabel(store.chain.chain),
    currentPrice: store.currentPrice,
    discountAmount: store.discountAmount,
    discountPercentage: store.discountPercentage,
    meetsThreshold: watchlistItems.some((item) =>
      isDiscountValueAboveThreshold(
        store.discountAmount,
        store.discountPercentage,
        item.watchType,
        item.thresholdValue,
      ),
    ),
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

  return `${difference > 0 ? "+" : ""}${difference.toFixed(2)}€ (${Math.round(Math.abs(percentage))}%)`;
}
