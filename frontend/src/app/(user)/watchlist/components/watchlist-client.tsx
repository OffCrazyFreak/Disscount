"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Search, Eye, ChevronDown } from "lucide-react";
import SearchBar from "@/components/custom/search-bar";
import NoResults from "@/components/custom/no-results";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import WatchlistItem from "@/app/(user)/watchlist/components/watchlist-item";
import CreateDiscountedListButton from "@/app/(user)/watchlist/components/create-discounted-list-button";
import { shoppingListService, watchlistService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { getProductByEan } from "@/lib/cijene-api";
import { filterByFields } from "@/utils/generic";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  calculateDiscountInfo,
  extractPinnedStoreChainCodes,
  getMaxDiscountPercentage,
  groupWatchlistItemsByProduct,
  isWatchThresholdReached,
  sortWatchlistItemsByDiscount,
  WatchlistItemWithProduct,
} from "@/app/(user)/watchlist/utils/watchlist-utils";

interface WatchlistSearchItem extends WatchlistItemWithProduct {
  productName: string;
  brand: string;
}

export default function WatchlistClient({ query }: { query: string }) {
  const pathname = usePathname();
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true);

  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  const { data: watchlistItems = [], isLoading: watchlistLoading } =
    watchlistService.useGetCurrentUserWatchlist();
  const { data: shoppingListItems = [], isLoading: shoppingListItemsLoading } =
    shoppingListService.useGetAllUserShoppingListItems();

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
      queryKey: ["cijene", "product", "ean", item.productApiId],
      queryFn: () => getProductByEan({ ean: item.productApiId }),
      enabled: Boolean(item.productApiId) && isAuthenticated,
      staleTime: 6 * 60 * 60 * 1000,
    })),
  });

  const productsLoading = productQueries.some(
    (query) => query.isLoading || query.isFetching,
  );

  const enrichedItems = useMemo<WatchlistItemWithProduct[]>(() => {
    return groupedWatchlistItems.map((groupedItem, index) => {
      const productQuery = productQueries[index];
      const isProductLoading = Boolean(
        productQuery?.isLoading || productQuery?.isFetching,
      );
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

  const filteredItems = useMemo<WatchlistSearchItem[]>(() => {
    const searchableItems = enrichedItems.map((item) => ({
      ...item,
      productName: item.product?.name || "",
      brand: item.product?.brand || "",
    }));

    return filterByFields(searchableItems, query, ["productName", "brand"]);
  }, [enrichedItems, query]);

  const discountedItems = useMemo<WatchlistItemWithProduct[]>(() => {
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

  return (
    <div className="space-y-4">
      <Suspense>
        <SearchBar
          placeholder="Pretraži popis za praćenje..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${filteredItems.length})`
            : `Praćeni proizvodi${userLoading || watchlistLoading ? "" : ` (${filteredItems.length})`}`}
        </h3>

        {!productsLoading && (
          <CreateDiscountedListButton discountedItems={discountedItems} />
        )}
      </div>

      {userLoading || watchlistLoading ? (
        <div className="grid place-items-center">
          <BlockLoadingSpinner />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {sortWatchlistItemsByDiscount(filteredItems, hasPinnedStores).map(
            (item) => (
              <WatchlistItem key={item.productApiId} item={item} />
            ),
          )}
        </div>
      ) : query ? (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      ) : (
        <div className="text-center py-12">
          <Eye className="size-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nema praćenih proizvoda
          </h3>

          <p className="text-gray-600 mb-6">
            Dodajte proizvode na popis za praćenje kako biste primali obavijesti
            o popustima.
          </p>
        </div>
      )}

      {!userLoading &&
        !watchlistLoading &&
        (shoppingListItemsLoading || filteredSuggestionItems.length > 0) && (
          <Collapsible
            open={isSuggestionsOpen}
            onOpenChange={setIsSuggestionsOpen}
          >
            <CollapsibleTrigger asChild className="cursor-pointer py-2">
              <button type="button" className="w-full text-left">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">
                    Prijedlozi proizvoda za praćenje (
                    {filteredSuggestionItems.length})
                  </h2>

                  <Separator className="flex-1 my-2" />

                  <div className="flex items-center gap-4">
                    <p className="hidden sm:inline text-gray-700 text-sm">
                      {isSuggestionsOpen ? "Sakrij" : "Prikaži"}
                    </p>

                    <ChevronDown
                      className={cn(
                        "size-8 text-gray-500 transition-transform flex-shrink-0",
                        isSuggestionsOpen && "rotate-180",
                      )}
                    />
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              {shoppingListItemsLoading ? (
                <div className="grid place-items-center py-6">
                  <BlockLoadingSpinner />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSuggestionItems.map((item) => (
                    <WatchlistItem
                      key={`suggestion-${item.productApiId}`}
                      item={item}
                      actionMode="add"
                      showThresholdBadges={false}
                    />
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
    </div>
  );
}
