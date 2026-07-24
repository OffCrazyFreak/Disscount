import { getChainLabel } from "@/utils/labels";
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

  return `${difference > 0 ? "+" : ""}${difference.toFixed(2)}€ (${Math.round(Math.abs(percentage))}%)`;
}
