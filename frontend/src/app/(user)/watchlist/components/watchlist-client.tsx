"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Eye } from "lucide-react";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import LoginRequired from "@/components/custom/common/login-required";
import WatchlistHeader from "@/app/(user)/watchlist/components/watchlist-header";
import WatchlistList from "@/app/(user)/watchlist/components/watchlist-list";
import WatchlistSuggestions from "@/app/(user)/watchlist/components/watchlist-suggestions";
import { useWatchlistData } from "@/app/(user)/watchlist/hooks/use-watchlist-data";
import {
  useRememberedRowCount,
  useRememberRowCount,
} from "@/hooks/use-remembered-row-count";

const ROW_COUNT_KEY = "watchlist:me";

interface IWatchlistClientProps {
  query: string;
}

export default function WatchlistClient({ query }: IWatchlistClientProps) {
  const pathname = usePathname();

  const {
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
  } = useWatchlistData(query);

  const listLoading = userLoading || watchlistLoading;

  // Above the auth gate: hooks cannot sit after an early return.
  const rows = useRememberedRowCount(ROW_COUNT_KEY, 3);
  useRememberRowCount(ROW_COUNT_KEY, filteredItems.length);

  if (requiresAuth) {
    return (
      <LoginRequired
        title="Praćeni proizvodi"
        description="Praćenje ti omogućuje da pratiš proizvode tako da dobiješ obavijest čim im cijena padne."
        icon={<Eye className="size-12 text-primary" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži popis za praćenje..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!listLoading && !hasWatchedProducts}
        />
      </Suspense>

      <WatchlistHeader
        query={query}
        itemCount={filteredItems.length}
        showCount={!listLoading}
        pricesUpdatedAt={pricesUpdatedAt}
        discountedItems={discountedItems}
        productsLoading={productsLoading}
      />

      <WatchlistList
        items={filteredItems}
        isLoading={listLoading}
        query={query}
        hasPinnedStores={hasPinnedStores}
        skeletonRows={rows}
      />

      {!listLoading &&
        (shoppingListItemsLoading || filteredSuggestionItems.length > 0) && (
          <WatchlistSuggestions
            items={filteredSuggestionItems}
            isLoading={shoppingListItemsLoading}
          />
        )}
    </div>
  );
}
