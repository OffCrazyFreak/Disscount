import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { shoppingListService } from "@/lib/api";
import { productByEanQueryOptions } from "@/lib/cijene-api";
import { rankByFields, type IRankedItem } from "@/utils/generic";
import { byDesc, chainComparators } from "@/utils/search/rank";
import {
  calculateDiscountInfo,
  getMaxDiscountPercentage,
  IWatchlistItemWithProduct,
} from "@/app/[locale]/(user)/watchlist/utils/watchlist-utils";
import type { IWatchlistSearchItem } from "@/lib/watchlist/watchlist-types";

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
      // Shared key with the product page/modal, so a suggestion is a cache hit, not a refetch.
      ...productByEanQueryOptions({ ean: productApiId }),
      enabled: Boolean(productApiId) && isAuthenticated,
    })),
  });

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
        isLoading: productQuery?.isLoading ?? false,
        // A failed background refetch keeps the cached prices on screen.
        error: !product && queryError instanceof Error ? queryError : null,
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

    // Relevance leads so this ranks like every other search; other terms settle its frequent ties.
    const ranked = rankByFields(searchableItems, query, [
      "productName",
      "brand",
    ]);

    return ranked
      .sort(
        chainComparators<IRankedItem<IWatchlistSearchItem>>(
          byDesc((rated) => rated.score),
          byDesc(
            (rated) =>
              suggestionOccurrenceByProductApiId.get(rated.item.productApiId) ||
              0,
          ),
          byDesc((rated) =>
            getMaxDiscountPercentage(rated.item.discountInfo, hasPinnedStores),
          ),
        ),
      )
      .map((rated) => rated.item);
  }, [
    suggestionItems,
    query,
    suggestionOccurrenceByProductApiId,
    hasPinnedStores,
  ]);

  return { shoppingListItemsLoading, filteredSuggestionItems };
}
