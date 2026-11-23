import { useMemo } from "react";
import { useUser } from "@/context/user-context";
import { useWatchedProducts } from "@/lib/watchlist/use-watched-products";
import { filterByFields } from "@/utils/format/generic";
import {
  calculateDiscountInfo,
  isAnyWatchThresholdReached,
} from "@/features/watchlist/utils/watchlist-utils";
import type {
  IWatchlistItemWithProduct,
  IWatchlistSearchItem,
} from "@/lib/watchlist/watchlist-types";
import { useWatchlistSuggestions } from "@/features/watchlist/hooks/use-watchlist-suggestions";

export function useWatchlistData(query: string) {
  const {
    accountUser,
    isAuthenticated,
    canShowAccountData,
    isLoading: userLoading,
  } = useUser();
  const {
    watchlistLoading,
    isWatchlistLoaded,
    groupedWatchlistItems,
    pinnedStoreChainCodes,
    hasPinnedStores,
    productQueries,
  } = useWatchedProducts(isAuthenticated, accountUser?.pinnedStores);

  const hasWatchedProducts = groupedWatchlistItems.length > 0;

  const productsLoading = productQueries.some((query) => query.isLoading);

  const timestamps = productQueries
    .map((query) => query.dataUpdatedAt)
    .filter((timestamp) => timestamp > 0);

  const pricesUpdatedAt = timestamps.length > 0 ? Math.max(...timestamps) : 0;

  const enrichedItems: IWatchlistItemWithProduct[] = groupedWatchlistItems.map(
    (groupedItem, index) => {
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
        // A failed background refetch keeps the cached prices on screen.
        error: !product && queryError instanceof Error ? queryError : null,
      };
    },
  );

  const searchableItems = enrichedItems.map((item) => ({
    ...item,
    productName: item.product?.name || "",
    brand: item.product?.brand || "",
  }));

  const filteredItems: IWatchlistSearchItem[] = filterByFields(
    searchableItems,
    query,
    ["productName", "brand"],
  );

  const discountedItems: IWatchlistItemWithProduct[] = productsLoading
    ? []
    : enrichedItems.filter((item) =>
        isAnyWatchThresholdReached(item, hasPinnedStores),
      );

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
    canShowAccountData,
    userLoading,
    watchlistLoading,
    isWatchlistLoaded,
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
