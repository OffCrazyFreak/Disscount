import { useCallback, useMemo, useState } from "react";
import { watchlistQueries } from "@/lib/api/watchlist/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { useUser } from "@/context/user-context";
import {
  extractPinnedStoreChainCodes,
  groupWatchlistItemsByProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import { buildWatchlistNotifications } from "@/context/build-watchlist-notifications";
import { INotificationsContext } from "@/context/notifications-types";

export function useWatchlistNotifications(): INotificationsContext {
  const { user, isAuthenticated } = useUser();
  const [openMenuSignal, setOpenMenuSignal] = useState(0);

  const requestOpenMenu = useCallback(() => {
    setOpenMenuSignal((signal) => signal + 1);
  }, []);

  // useAuthedQuery gates on the session, so /api/watchlist/me (and
  // /api/auth/token behind it) is never hit while logged out.
  const { data: watchlistItems = [], pending: watchlistLoading } =
    useAuthedQuery(watchlistQueries.me());

  const groupedWatchlistItems = useMemo(
    () => groupWatchlistItemsByProduct(watchlistItems),
    [watchlistItems],
  );

  const pinnedStoreChainCodes = useMemo(
    () => extractPinnedStoreChainCodes(user?.pinnedStores),
    [user?.pinnedStores],
  );

  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  // Progressive loading: one request per grouped product.
  const { results: productQueries } = useProductsByEans(
    groupedWatchlistItems.map((item) => item.productApiId),
    { enabled: isAuthenticated },
  );

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
