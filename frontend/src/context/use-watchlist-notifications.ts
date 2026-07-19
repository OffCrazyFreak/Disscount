import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { watchlistService } from "@/lib/api";
import { getProductByEan, productByEanQueryKey } from "@/lib/cijene-api";
import { useUser } from "@/context/user-context";
import {
  extractPinnedStoreChainCodes,
  groupWatchlistItemsByProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { buildWatchlistNotifications } from "./build-watchlist-notifications";
import { INotificationsContext } from "./notifications-types";

export function useWatchlistNotifications(): INotificationsContext {
  const { user, isAuthenticated } = useUser();

  // Gate the watchlist query - avoids hitting /api/watchlist/me (and /api/auth/token) when logged out
  const { data: watchlistItems = [], isLoading: watchlistLoading } =
    watchlistService.useGetCurrentUserWatchlist({ enabled: isAuthenticated });

  const groupedWatchlistItems = useMemo(
    () => groupWatchlistItemsByProduct(watchlistItems),
    [watchlistItems],
  );

  const pinnedStoreChainCodes = useMemo(
    () => extractPinnedStoreChainCodes(user?.pinnedStores),
    [user?.pinnedStores],
  );

  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  // Progressive loading: fetch product data per grouped product
  const productQueries = useQueries({
    queries: groupedWatchlistItems.map((item) => ({
      queryKey: productByEanQueryKey(item.productApiId),
      queryFn: () => getProductByEan({ ean: item.productApiId }),
      enabled: !!item.productApiId && isAuthenticated,
      staleTime: 6 * 60 * 60 * 1000, // 6 hours
    })),
  });

  const productQueriesStateKey = productQueries
    .map(
      (query, index) =>
        `${groupedWatchlistItems[index]?.productApiId || ""}:${query.status}:${query.fetchStatus}:${query.dataUpdatedAt}:${query.errorUpdatedAt}`,
    )
    .join("|");

  // Generate grouped notifications from products with threshold-matched discounts
  const { notifications, summary } = useMemo(
    () =>
      buildWatchlistNotifications(
        groupedWatchlistItems,
        productQueries,
        pinnedStoreChainCodes,
        hasPinnedStores,
      ),
    [
      groupedWatchlistItems,
      pinnedStoreChainCodes,
      hasPinnedStores,
      productQueriesStateKey,
    ],
  );

  const isLoading = watchlistLoading || productQueries.some((q) => q.isLoading);

  return {
    notifications,
    summary,
    isLoading,
    hasNotifications: notifications.length > 0,
    hasWatchlistItems: watchlistItems.length > 0,
  };
}
