"use client";

import MapSearch from "@/features/map/components/search/map-search";
import MapChainSelect from "@/features/map/components/search/map-chain-select";
import MapOpenFilter from "@/features/map/components/search/map-open-filter";
import ResultCountStatus from "@/features/map/components/search/result-count-status";
import NearMeButton from "@/features/map/components/search/near-me-button";
import RecentSearches from "@/features/map/components/search/recent-searches";
import ViewSortedList from "@/features/map/components/store/view-sorted-list";
import { IMapViewModel } from "@/features/map/hooks/use-map-view-model";
import { IViewArea } from "@/features/map/utils/view/view-area";

interface IMapPanelProps {
  model: IMapViewModel;
  /** What the map shows right now; stores inside it lead the list. */
  viewArea: IViewArea | null;
  /** Off on phones, where the search sits in the map's floating bar. */
  withSearch?: boolean;
}

export default function MapPanel({
  model,
  viewArea,
  withSearch = true,
}: IMapPanelProps) {
  const { selected, listed } = model;
  // A shared link can name a store the filters hide; it still opens, on top.
  const pinned =
    selected && !listed.some((row) => row.key === selected.key)
      ? [selected]
      : [];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {withSearch && <MapSearch />}

      {!model.query && (
        <RecentSearches
          searches={model.recentSearches}
          onPick={model.search}
          onClear={model.clearRecentSearches}
        />
      )}

      <MapChainSelect
        chains={model.chainCodes}
        selected={model.chains}
        onChange={model.setChainFilter}
      />

      <MapOpenFilter
        filter={model.openFilter}
        onChange={model.setOpenFilter}
        hasHoursFailed={model.hasHoursFailed}
        onRetry={model.retryHours}
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
