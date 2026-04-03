"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Search, Eye } from "lucide-react";
import SearchBar from "@/components/custom/search-bar";
import NoResults from "@/components/custom/no-results";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import WatchlistItem from "@/app/(user)/watchlist/components/watchlist-item";
import CreateDiscountedListButton from "@/app/(user)/watchlist/components/create-discounted-list-button";
import { watchlistService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { getProductByEan } from "@/lib/cijene-api";
import { filterByFields } from "@/utils/generic";
import {
  calculateDiscountInfo,
  extractPinnedStoreChainCodes,
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

  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  const { data: watchlistItems = [], isLoading: watchlistLoading } =
    watchlistService.useGetCurrentUserWatchlist();

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

  const enrichedItems = useMemo<WatchlistItemWithProduct[]>(() => {
    return groupedWatchlistItems.map((groupedItem, index) => {
      const productQuery = productQueries[index];
      const product = productQuery?.data;
      const queryError = productQuery?.error;

      return {
        productApiId: groupedItem.productApiId,
        watchlistItems: groupedItem.watchlistItems,
        product,
        discountInfo: product
          ? calculateDiscountInfo(product, pinnedStoreChainCodes)
          : null,
        isLoading: productQuery?.isLoading ?? false,
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
  }, [enrichedItems, hasPinnedStores]);

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

        <CreateDiscountedListButton discountedItems={discountedItems} />
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
            o sniženjima.
          </p>
          <p className="text-sm text-muted-foreground">
            Na stranici proizvoda kliknite na <Eye className="inline size-4" />{" "}
            ikonu za praćenje.
          </p>
        </div>
      )}
    </div>
  );
}
