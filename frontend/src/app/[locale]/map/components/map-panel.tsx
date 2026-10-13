"use client";

import { ReactNode, Suspense, useState } from "react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ChainFilterChips from "@/app/[locale]/map/components/chain-filter-chips";
import MissingStoresNote from "@/app/[locale]/map/components/missing-stores-note";
import NearMeButton from "@/app/[locale]/map/components/near-me-button";
import RecentSearches from "@/app/[locale]/map/components/recent-searches";
import StoreDetails from "@/app/[locale]/map/components/store-details";
import StoreList from "@/app/[locale]/map/components/store-list";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";

interface IMapPanelProps {
  model: IMapViewModel;
  /** Server-rendered chain overview, so the page has crawlable text. */
  chainSummary: ReactNode;
}

/** Search, filters and the list, or the selected store. Same on every screen. */
export default function MapPanel({ model, chainSummary }: IMapPanelProps) {
  const t = useTranslations("map");
  const [lastKey, setLastKey] = useState<string | null>(null);

  if (model.selected && model.selected.key !== lastKey) {
    setLastKey(model.selected.key);
  }

  if (model.selected) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <StoreDetails
          row={model.selected}
          onClose={() => model.selectStore(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("search.placeholder")}
          searchRoute="/map"
          clearable
          autoSearch
          shallow
          submitButtonLocation="none"
        />
      </Suspense>

      {!model.query && (
        <RecentSearches
          searches={model.recentSearches}
          onPick={model.search}
          onClear={model.clearRecentSearches}
        />
      )}

      <ChainFilterChips
        chains={model.chainCodes}
        selected={model.chains}
        onChange={model.setChainFilter}
      />

      <NearMeButton
        status={model.geolocation.status}
        onLocate={model.geolocation.locate}
        onClear={model.geolocation.clear}
      />

      <MissingStoresNote
        shown={model.listed.length}
        unplaced={model.unplacedCount}
      />

      <StoreList
        rows={model.listed}
        selectedKey={null}
        onSelect={model.selectStore}
        returnFocusKey={lastKey}
      />

      {chainSummary}
    </div>
  );
}
