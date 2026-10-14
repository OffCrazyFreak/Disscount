import { useCallback, useMemo, useState } from "react";
import { useUser } from "@/context/user-context";
import { useWatchedProducts } from "@/lib/watchlist/use-watched-products";
import { buildWatchlistNotifications } from "@/context/build-watchlist-notifications";
import { INotificationsContext } from "@/context/notifications-types";

export function useWatchlistNotifications(): INotificationsContext {
  const { user, isAuthenticated } = useUser();
  const [openMenuSignal, setOpenMenuSignal] = useState(0);

  const requestOpenMenu = useCallback(() => {
    setOpenMenuSignal((signal) => signal + 1);
  }, []);

  const {
    watchlistItems,
    watchlistLoading,
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    hasPinnedStores,
    productQueries,
  } = useWatchedProducts(isAuthenticated, user?.pinnedStores);

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
    // productQueriesStateKey stands in for the array React Query rebuilds each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    openMenuSignal,
    requestOpenMenu,
  };
}
