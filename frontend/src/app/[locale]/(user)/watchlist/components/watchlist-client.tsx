"use client";

import { usePathname } from "@/i18n/navigation";
import { Suspense } from "react";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import LoginRequired from "@/components/custom/common/login-required";
import JumpSection from "@/components/custom/common/jump-section";
import SectionJumpNav from "@/components/custom/common/section-jump-nav";
import WatchlistHeader from "@/app/[locale]/(user)/watchlist/components/watchlist-header";
import WatchlistList from "@/app/[locale]/(user)/watchlist/components/watchlist-list";
import WatchlistSuggestions from "@/app/[locale]/(user)/watchlist/components/watchlist-suggestions";
import { useWatchlistData } from "@/app/[locale]/(user)/watchlist/hooks/use-watchlist-data";

// One source for each id, which the nav links to and the URL hash names.
const SECTION_IDS = { watched: "watched", suggestions: "suggestions" };

interface IWatchlistClientProps {
  query: string;
}

export default function WatchlistClient({ query }: IWatchlistClientProps) {
  const t = useTranslations("watchlist");
  const pathname = usePathname();

  const {
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
  } = useWatchlistData(query);

  if (!userLoading && !isAuthenticated) {
    return (
      <LoginRequired
        title={t("client.loginTitle")}
        description={t("client.loginDescription")}
        icon={<Eye className="size-12 text-primary" />}
      />
    );
  }

  const listLoading = userLoading || watchlistLoading;
  const showsSuggestions =
    !listLoading &&
    (shoppingListItemsLoading || filteredSuggestionItems.length > 0);
  // Linked only once there are suggestions, so a loading section never flashes a link.
  const hasSuggestions =
    showsSuggestions &&
    !shoppingListItemsLoading &&
    filteredSuggestionItems.length > 0;

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("client.searchPlaceholder")}
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
          disabled={!listLoading && !hasWatchedProducts}
        />
      </Suspense>

      <SectionJumpNav
        label={t("sectionNav.label")}
        sections={[
          {
            id: SECTION_IDS.watched,
            label: t("header.title"),
            shortLabel: t("sectionNav.watchedShort"),
          },
          ...(hasSuggestions
            ? [
                {
                  id: SECTION_IDS.suggestions,
                  label: t("suggestions.label"),
                  shortLabel: t("sectionNav.suggestionsShort"),
                  count: filteredSuggestionItems.length,
                },
              ]
            : []),
        ]}
      />

      <JumpSection id={SECTION_IDS.watched} className="space-y-4">
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
        />
      </JumpSection>

      {showsSuggestions && (
        <JumpSection id={SECTION_IDS.suggestions}>
          <WatchlistSuggestions
            items={filteredSuggestionItems}
            isLoading={shoppingListItemsLoading}
          />
        </JumpSection>
      )}
    </div>
  );
}
