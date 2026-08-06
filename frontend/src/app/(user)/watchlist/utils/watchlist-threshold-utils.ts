import { WatchType } from "@/lib/api/types";
import {
  IDiscountInfo,
  IWatchlistItemWithProduct,
} from "@/app/(user)/watchlist/typings/watchlist-types";

export function isWatchThresholdReached(
  discountInfo: IDiscountInfo,
  watchType: WatchType,
  thresholdValue: number,
  hasPinnedStores: boolean,
): boolean {
  const difference = hasPinnedStores
    ? discountInfo.preferredDifference
    : discountInfo.totalDifference;

  if (difference === null || difference >= 0) {
    return false;
  }

  const discountAmount = hasPinnedStores
    ? discountInfo.preferredDiscount || 0
    : discountInfo.totalDiscount || 0;
  const discountPercentage = hasPinnedStores
    ? discountInfo.preferredPercentage || 0
    : discountInfo.totalPercentage || 0;

  return isDiscountValueAboveThreshold(
    discountAmount,
    discountPercentage,
    watchType,
    thresholdValue,
  );
}

/** A product can carry several watch rows (one percentage, one absolute), so any of them firing counts. */
export function isAnyWatchThresholdReached(
  item: IWatchlistItemWithProduct,
  hasPinnedStores: boolean,
): boolean {
  const discountInfo = item.discountInfo;

  if (!discountInfo || !item.product) {
    return false;
  }

  return item.watchlistItems.some((watchlistItem) =>
    isWatchThresholdReached(
      discountInfo,
      watchlistItem.watchType,
      watchlistItem.thresholdValue,
      hasPinnedStores,
    ),
  );
}

export function isDiscountValueAboveThreshold(
  discountAmount: number,
  discountPercentage: number,
  watchType: WatchType,
  thresholdValue: number,
): boolean {
  if (watchType === WatchType.absolute) {
    return discountAmount >= thresholdValue;
  }

  return discountPercentage >= thresholdValue;
}

export function getMaxDiscountAmount(
  discountInfo: IDiscountInfo | null,
  hasPinnedStores: boolean,
): number {
  if (!discountInfo) {
    return 0;
  }

  const discount = hasPinnedStores
    ? discountInfo.preferredDiscount
    : discountInfo.totalDiscount;

  return discount ?? 0;
}

export function getMaxDiscountPercentage(
  discountInfo: IDiscountInfo | null,
  hasPinnedStores: boolean,
): number {
  // The stored percentage is unsigned, so an above-average price would otherwise
  // rank as if it were a discount of the same size. The amount is floored at 0,
  // so it doubles as the "is actually discounted" test.
  if (getMaxDiscountAmount(discountInfo, hasPinnedStores) <= 0) {
    return 0;
  }

  const percentage = hasPinnedStores
    ? discountInfo?.preferredPercentage
    : discountInfo?.totalPercentage;

  return percentage ?? 0;
}
