import { useMemo } from "react";
import { watchlistQueries } from "@/lib/api/watchlist/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import { useUser } from "@/context/user-context";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { filterByFields } from "@/utils/generic";
import {
  calculateDiscountInfo,
  extractPinnedStoreChainCodes,
  groupWatchlistItemsByProduct,
  isWatchThresholdReached,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import type {
  IWatchlistItemWithProduct,
  IWatchlistSearchItem,
} from "@/app/(user)/watchlist/typings/watchlist-types";
import { useWatchlistSuggestions } from "@/app/(user)/watchlist/hooks/use-watchlist-suggestions";

export function useWatchlistData(query: string) {
  const { user, hasSession, isLoading: userLoading } = useUser();
  const {
    data: watchlistItems = [],
    pending: watchlistLoading,
    requiresAuth,
  } = useAuthedQuery(watchlistQueries.me());

  const groupedWatchlistItems = useMemo(
    () => groupWatchlistItemsByProduct(watchlistItems),
    [watchlistItems],
  );
  const hasWatchedProducts = groupedWatchlistItems.length > 0;

  const pinnedStoreChainCodes = useMemo(
    () => extractPinnedStoreChainCodes(user?.pinnedStores),
    [user?.pinnedStores],
  );

  const hasPinnedStores = pinnedStoreChainCodes.length > 0;

  const {
    results: productQueries,
    pending: productsLoading,
    // Drives the "last synced" label.
    updatedAt: pricesUpdatedAt,
  } = useProductsByEans(
    groupedWatchlistItems.map((item) => item.productApiId),
    { enabled: hasSession },
  );

  const enrichedItems = useMemo<IWatchlistItemWithProduct[]>(() => {
    return groupedWatchlistItems.map((groupedItem, index) => {
      const productQuery = productQueries[index];
      const isProductLoading = Boolean(productQuery?.isLoading);
      const product = isProductLoading ? undefined : productQuery?.data;
      const queryError = productQuery?.error;

      return {
        productApiId: groupedItem.productApiId,
        watchlistItems: groupedItem.watchlistItems,
        product,
        discountInfo: product
          ? calculateDiscountInfo(product, pinnedStoreChainCodes)
          : null,
        isLoading: isProductLoading,
        error: queryError instanceof Error ? queryError : null,
      };
    });
  }, [groupedWatchlistItems, productQueries, pinnedStoreChainCodes]);

  const filteredItems = useMemo<IWatchlistSearchItem[]>(() => {
    const searchableItems = enrichedItems.map((item) => ({
      ...item,
      productName: item.product?.name || "",
      brand: item.product?.brand || "",
    }));

    return filterByFields(searchableItems, query, ["productName", "brand"]);
  }, [enrichedItems, query]);

  const discountedItems = useMemo<IWatchlistItemWithProduct[]>(() => {
    if (productsLoading) {
      return [];
    }

    return enrichedItems.filter((item) => {
      if (!item.discountInfo || !item.product) {
        return false;
      }

      const discountInfo = item.discountInfo;

      return item.watchlistItems.some((watchlistItem) =>
        isWatchThresholdReached(
          discountInfo,
          watchlistItem.watchType,
          watchlistItem.thresholdValue,
          hasPinnedStores,
        ),
      );
    });
  }, [enrichedItems, hasPinnedStores, productsLoading]);

  const watchedProductApiIds = useMemo(() => {
    return new Set(groupedWatchlistItems.map((item) => item.productApiId));
  }, [groupedWatchlistItems]);

  const { shoppingListItemsLoading, filteredSuggestionItems } =
    useWatchlistSuggestions({
      query,
      watchedProductApiIds,
      pinnedStoreChainCodes,
      hasPinnedStores,
      hasSession,
    });

  return {
    requiresAuth,
    userLoading,
    watchlistLoading,
    hasWatchedProducts,
    shoppingListItemsLoading,
    hasPinnedStores,
    productsLoading,
    pricesUpdatedAt,
    filteredItems,
    discountedItems,
    filteredSuggestionItems,
  };
}
