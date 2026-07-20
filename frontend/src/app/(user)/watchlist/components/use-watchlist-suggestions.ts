import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { shoppingListService } from "@/lib/api";
import { getProductByEan } from "@/lib/cijene-api";
import { filterByFields } from "@/utils/generic";
import {
  calculateDiscountInfo,
  getMaxDiscountPercentage,
  WatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import type { WatchlistSearchItem } from "@/app/(user)/watchlist/components/use-watchlist-data";

interface IUseWatchlistSuggestionsParams {
  query: string;
  watchedProductApiIds: Set<string>;
  pinnedStoreChainCodes: string[];
  hasPinnedStores: boolean;
  isAuthenticated: boolean;
}

export function useWatchlistSuggestions({
  query,
  watchedProductApiIds,
  pinnedStoreChainCodes,
  hasPinnedStores,
  isAuthenticated,
}: IUseWatchlistSuggestionsParams) {
  const { data: shoppingListItems = [], isLoading: shoppingListItemsLoading } =
    shoppingListService.useGetAllUserShoppingListItems({
      enabled: isAuthenticated,
    });

  const suggestionProductApiIds = useMemo(() => {
    const uniqueProductApiIds = new Set<string>();
    const suggestions: string[] = [];

    for (const shoppingListItem of shoppingListItems) {
      const productApiId = shoppingListItem.ean?.trim();

      if (
        !productApiId ||
        uniqueProductApiIds.has(productApiId) ||
        watchedProductApiIds.has(productApiId)
      ) {
        continue;
      }

      uniqueProductApiIds.add(productApiId);
      suggestions.push(productApiId);
    }

    return suggestions;
  }, [shoppingListItems, watchedProductApiIds]);

  const suggestionOccurrenceByProductApiId = useMemo(() => {
    const occurrenceMap = new Map<string, number>();

    for (const shoppingListItem of shoppingListItems) {
      const productApiId = shoppingListItem.ean?.trim();

      if (!productApiId || watchedProductApiIds.has(productApiId)) {
        continue;
      }

      const currentCount = occurrenceMap.get(productApiId) || 0;
      occurrenceMap.set(productApiId, currentCount + 1);
    }

    return occurrenceMap;
  }, [shoppingListItems, watchedProductApiIds]);

  const suggestionProductQueries = useQueries({
    queries: suggestionProductApiIds.map((productApiId) => ({
      queryKey: [
        "cijene",
        "product",
        "ean",
        "watchlist-suggestion",
        productApiId,
      ],
      queryFn: () => getProductByEan({ ean: productApiId }),
      enabled: Boolean(productApiId) && isAuthenticated,
      staleTime: 6 * 60 * 60 * 1000,
    })),
  });

  const suggestionItems = useMemo<WatchlistItemWithProduct[]>(() => {
    return suggestionProductApiIds.map((productApiId, index) => {
      const productQuery = suggestionProductQueries[index];
      const product = productQuery?.data;
      const queryError = productQuery?.error;

      return {
        productApiId,
        watchlistItems: [],
        product,
        discountInfo: product
          ? calculateDiscountInfo(product, pinnedStoreChainCodes)
          : null,
        isLoading: productQuery?.isLoading ?? false,
        error: queryError instanceof Error ? queryError : null,
      };
    });
  }, [
    suggestionProductApiIds,
    suggestionProductQueries,
    pinnedStoreChainCodes,
  ]);

  const filteredSuggestionItems = useMemo<WatchlistSearchItem[]>(() => {
    const searchableItems = suggestionItems.map((item) => ({
      ...item,
      productName: item.product?.name || "",
      brand: item.product?.brand || "",
    }));

    const filteredItems = filterByFields(searchableItems, query, [
      "productName",
      "brand",
    ]);

    return [...filteredItems].sort((a, b) => {
      const occurrenceA =
        suggestionOccurrenceByProductApiId.get(a.productApiId) || 0;
      const occurrenceB =
        suggestionOccurrenceByProductApiId.get(b.productApiId) || 0;

      if (occurrenceB !== occurrenceA) {
        return occurrenceB - occurrenceA;
      }

      return (
        getMaxDiscountPercentage(b.discountInfo, hasPinnedStores) -
        getMaxDiscountPercentage(a.discountInfo, hasPinnedStores)
      );
    });
  }, [
    suggestionItems,
    query,
    suggestionOccurrenceByProductApiId,
    hasPinnedStores,
  ]);

  return { shoppingListItemsLoading, filteredSuggestionItems };
}
