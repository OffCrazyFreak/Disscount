"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ChainFilterChips from "@/app/[locale]/map/components/chain-filter-chips";
import ResultCountStatus from "@/app/[locale]/map/components/result-count-status";
import NearMeButton from "@/app/[locale]/map/components/near-me-button";
import RecentSearches from "@/app/[locale]/map/components/recent-searches";
import ViewSortedList from "@/app/[locale]/map/components/view-sorted-list";
import { IMapViewModel } from "@/app/[locale]/map/hooks/use-map-view-model";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";

interface IMapPanelProps {
  model: IMapViewModel;
  /** What the map shows right now; stores inside it lead the list. */
  viewArea: IViewArea | null;
}

/** Search, filters and the list, with the selected store open. Same on every screen. */
export default function MapPanel({ model, viewArea }: IMapPanelProps) {
  const t = useTranslations("map");

  const { selected, listed } = model;
  // A shared link can name a store the filters hide; it still opens, on top.
  const pinned =
    selected && !listed.some((row) => row.key === selected.key)
      ? [selected]
      : [];
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

      <ResultCountStatus
        shown={pinned.length + listed.length}
        unplaced={model.unplacedCount}
      />

      <ViewSortedList
        pinned={pinned}
        listed={listed}
        viewArea={viewArea}
        selectedKey={selected?.key ?? null}
        onSelect={model.selectStore}
      />
    </div>
  );
}
