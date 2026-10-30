export type {
  IDiscountInfo,
  IWatchlistItemWithProduct,
} from "@/lib/watchlist/watchlist-types";

export { extractPinnedStoreChainCodes } from "@/lib/watchlist/watchlist-grouping-utils";

export {
  getScopedDiscountedStores,
  calculateDiscountInfo,
} from "@/lib/watchlist/watchlist-discount-utils";

export {
  isWatchThresholdReached,
  isAnyWatchThresholdReached,
  getMaxDiscountPercentage,
} from "@/lib/watchlist/watchlist-threshold-utils";

export { sortWatchlistItemsByDiscount } from "@/app/[locale]/(user)/watchlist/utils/watchlist-sort-utils";
