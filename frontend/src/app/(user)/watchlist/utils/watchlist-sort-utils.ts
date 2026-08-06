import { byDesc, chainComparators } from "@/utils/search/rank";
import { IWatchlistItemWithProduct } from "@/app/(user)/watchlist/typings/watchlist-types";
import {
  getMaxDiscountAmount,
  getMaxDiscountPercentage,
  isAnyWatchThresholdReached,
} from "@/app/(user)/watchlist/utils/watchlist-threshold-utils";

/**
 * Items that hit the threshold the user set come first, then the biggest saving.
 * Every term reads the preferred-store scope, falling back to all stores when
 * nothing is pinned.
 */
export function sortWatchlistItemsByDiscount<
  T extends IWatchlistItemWithProduct,
>(items: T[], hasPinnedStores: boolean): T[] {
  return [...items].sort(
    chainComparators<T>(
      byDesc((item) =>
        isAnyWatchThresholdReached(item, hasPinnedStores) ? 1 : 0,
      ),
      byDesc((item) =>
        getMaxDiscountAmount(item.discountInfo, hasPinnedStores),
      ),
      byDesc((item) =>
        getMaxDiscountPercentage(item.discountInfo, hasPinnedStores),
      ),
    ),
  );
}
