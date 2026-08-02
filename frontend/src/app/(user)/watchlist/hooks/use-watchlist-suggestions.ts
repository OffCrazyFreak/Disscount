import { useMemo } from "react";
import { shoppingListQueries } from "@/lib/api/shopping-lists/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import { useProductsByEans } from "@/lib/cijene-api/use-products-by-eans";
import { filterByFields } from "@/utils/generic";
import {
  calculateDiscountInfo,
  getMaxDiscountPercentage,
  IWatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";
import type { IWatchlistSearchItem } from "@/app/(user)/watchlist/typings/watchlist-types";

interface IUseWatchlistSuggestionsParams {
  query: string;
  watchedProductApiIds: Set<string>;
  pinnedStoreChainCodes: string[];
  hasPinnedStores: boolean;
  hasSession: boolean;
}

export function useWatchlistSuggestions({
  query,
  watchedProductApiIds,
  pinnedStoreChainCodes,
  hasPinnedStores,
  hasSession,
}: IUseWatchlistSuggestionsParams) {
  const { data: shoppingListItems = [], pending: shoppingListItemsLoading } =
    useAuthedQuery(shoppingListQueries.myItems());

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

  const { results: suggestionProductQueries } = useProductsByEans(
    suggestionProductApiIds,
    { enabled: hasSession },
  );

  const suggestionItems = useMemo<IWatchlistItemWithProduct[]>(() => {
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
        isLoading: productQuery?.isPending ?? false,
        error: queryError instanceof Error ? queryError : null,
      };
    });
  }, [
    suggestionProductApiIds,
    suggestionProductQueries,
    pinnedStoreChainCodes,
  ]);

  const filteredSuggestionItems = useMemo<IWatchlistSearchItem[]>(() => {
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
