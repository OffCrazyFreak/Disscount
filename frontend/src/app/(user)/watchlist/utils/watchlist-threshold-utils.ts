import { WatchType } from "@/lib/api/types";
import {
  IDiscountInfo,
  IWatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-types";

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

export function getMaxDiscountPercentage(
  discountInfo: IDiscountInfo | null,
  hasPinnedStores: boolean,
): number {
  if (!discountInfo) {
    return 0;
  }

  const percentage = hasPinnedStores
    ? discountInfo.preferredPercentage || 0
    : discountInfo.totalPercentage || 0;

  return percentage;
}

export function sortWatchlistItemsByDiscount(
  items: IWatchlistItemWithProduct[],
  hasPinnedStores: boolean,
): IWatchlistItemWithProduct[] {
  return [...items].sort((a, b) => {
    const maxDiscountA = getMaxDiscountPercentage(
      a.discountInfo,
      hasPinnedStores,
    );
    const maxDiscountB = getMaxDiscountPercentage(
      b.discountInfo,
      hasPinnedStores,
    );

    return maxDiscountB - maxDiscountA;
  });
}
