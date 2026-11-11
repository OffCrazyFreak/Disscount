"use client";

import { usePathname } from "@/i18n/navigation";
import { Suspense } from "react";
import { useIsRestoring } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import SearchResultsStatus from "@/components/custom/live-status/search-results-status";
import LoginRequired from "@/components/custom/common/login-required";
import NotSavedOffline from "@/components/custom/common/not-saved-offline";
import { useIsNotSavedOffline } from "@/hooks/use-is-not-saved-offline";
import SectionTabs from "@/components/custom/common/section-tabs";
import WatchlistHeader from "@/app/[locale]/(user)/watchlist/components/watchlist-header";
import WatchlistList from "@/app/[locale]/(user)/watchlist/components/watchlist-list";
import WatchlistSuggestions from "@/app/[locale]/(user)/watchlist/components/watchlist-suggestions";
import { useWatchlistData } from "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-data";

interface IWatchlistClientProps {
  query: string;
}

export default function WatchlistClient({ query }: IWatchlistClientProps) {
  const t = useTranslations("watchlist");
  const pathname = usePathname();

  const {
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
  } = useWatchlistData(query);
  // Offline the failed session check can land before IndexedDB is read back.
  const isRestoring = useIsRestoring();
  const isNotSavedOffline = useIsNotSavedOffline(isWatchlistLoaded);

  if (!userLoading && !canShowAccountData) {
    return (
      <LoginRequired
        title={t("client.loginTitle")}
        description={t("client.loginDescription")}
        icon={<Eye className="size-12 text-primary" />}
      />
    );
  }

  if (isNotSavedOffline)
    return <NotSavedOffline title={t("client.loginTitle")} />;

  const listLoading = userLoading || watchlistLoading || isRestoring;
  // A tab only once there are suggestions, so a loading section never flashes one.
  const hasSuggestions =
    !listLoading &&
    !shoppingListItemsLoading &&
    filteredSuggestionItems.length > 0;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("client.searchPlaceholder")}
          searchRoute={pathname}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!listLoading && !hasWatchedProducts}
        />
      </Suspense>

      <SearchResultsStatus
        query={query}
        count={filteredItems.length}
        isLoading={listLoading || productsLoading}
      />

      <SectionTabs
        label={t("sectionNav.label")}
        tabs={[
          {
            id: "watched",
            label: t("header.title"),
            shortLabel: t("sectionNav.watchedShort"),
            content: (
              <div className="space-y-4">
                <WatchlistHeader
                  query={query}
                  itemCount={filteredItems.length}
                  pricesUpdatedAt={pricesUpdatedAt}
                  discountedItems={discountedItems}
                  productsLoading={productsLoading}
                />

                <WatchlistList
                  items={filteredItems}
                  isLoading={listLoading}
                  query={query}
                  hasPinnedStores={hasPinnedStores}
                />
              </div>
            ),
          },
          ...(hasSuggestions
            ? [
                {
                  id: "suggestions",
                  label: t("suggestions.label"),
                  shortLabel: t("sectionNav.suggestionsShort"),
                  count: filteredSuggestionItems.length,
                  content: (
                    <WatchlistSuggestions items={filteredSuggestionItems} />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
}
