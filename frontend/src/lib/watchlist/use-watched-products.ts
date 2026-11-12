import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { watchlistService } from "@/lib/api";
import { PinnedStoreDto } from "@/lib/api/types";
import { productByEanQueryOptions } from "@/lib/cijene-api";
import {
  extractPinnedStoreChainCodes,
  groupWatchlistItemsByProduct,
} from "@/lib/watchlist/watchlist-grouping-utils";

export function useWatchedProducts(
  isAuthenticated: boolean,
  pinnedStores: PinnedStoreDto[] | null | undefined,
) {
  // Gated so a logged-out visit never hits /api/watchlist/me (and /api/auth/token).
  const {
    data: watchlistItems = [],
    isLoading: watchlistLoading,
    isSuccess: isWatchlistLoaded,
    isFetching: isWatchlistFetching,
  } = watchlistService.useGetCurrentUserWatchlist({ enabled: isAuthenticated });

  const groupedWatchlistItems = useMemo(
    () => groupWatchlistItemsByProduct(watchlistItems),
    [watchlistItems],
  );

  const pinnedStoreChainCodes = useMemo(
    () => extractPinnedStoreChainCodes(pinnedStores),
    [pinnedStores],
  );

  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  const productQueries = useQueries({
    queries: groupedWatchlistItems.map((item) => ({
      // Same key the modal reads, so opening it is a cache hit, not a skeleton.
      ...productByEanQueryOptions({ ean: item.productApiId }),
      enabled: Boolean(item.productApiId) && isAuthenticated,
    })),
  });

  return {
    watchlistItems,
    watchlistLoading,
    isWatchlistLoaded,
    isWatchlistFetching,
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    hasPinnedStores,
    productQueries,
  };
}
