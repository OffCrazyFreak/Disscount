import { useMemo } from "react";
import { useUser } from "@/context/user-context";
import { useWatchedProducts } from "@/lib/watchlist/use-watched-products";
import { filterByFields } from "@/utils/generic";
import {
  calculateDiscountInfo,
  isAnyWatchThresholdReached,
} from "@/app/[locale]/(user)/watchlist/utils/watchlist-utils";
import type {
  IWatchlistItemWithProduct,
  IWatchlistSearchItem,
} from "@/lib/watchlist/watchlist-types";
import { useWatchlistSuggestions } from "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-suggestions";

export function useWatchlistData(query: string) {
  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  const {
    watchlistLoading,
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    hasPinnedStores,
    productQueries,
  } = useWatchedProducts(isAuthenticated, user?.pinnedStores);

  const hasWatchedProducts = groupedWatchlistItems.length > 0;

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

    return enrichedItems.filter((item) =>
      isAnyWatchThresholdReached(item, hasPinnedStores),
    );
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
