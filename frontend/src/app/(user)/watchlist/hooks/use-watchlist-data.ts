import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { watchlistService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { getProductByEan, productByEanQueryKey } from "@/lib/cijene-api";
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
  const { user, isAuthenticated, isLoading: userLoading } = useUser();
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

  const productQueries = useQueries({
    queries: groupedWatchlistItems.map((item) => ({
      // Same key the modal reads, so opening it is a cache hit, not a skeleton.
      queryKey: productByEanQueryKey(item.productApiId),
      queryFn: () => getProductByEan({ ean: item.productApiId }),
      enabled: Boolean(item.productApiId) && isAuthenticated,
      staleTime: 6 * 60 * 60 * 1000,
    })),
  });

  const productsLoading = productQueries.some((query) => query.isLoading);

  // Drives the "last synced" label.
  const pricesUpdatedAt = useMemo(() => {
    const timestamps = productQueries
      .map((query) => query.dataUpdatedAt)
      .filter((timestamp) => timestamp > 0);

    return timestamps.length > 0 ? Math.max(...timestamps) : 0;
  }, [productQueries]);

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
      isAuthenticated,
    });

  return {
    isAuthenticated,
    userLoading,
    watchlistLoading,
    shoppingListItemsLoading,
    hasPinnedStores,
    productsLoading,
    pricesUpdatedAt,
    filteredItems,
    discountedItems,
    filteredSuggestionItems,
  };
}
