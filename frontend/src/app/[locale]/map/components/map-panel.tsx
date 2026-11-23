"use client";

import { useTranslations } from "next-intl";

import MapLoadState from "@/app/[locale]/map/components/map-load-state";
import MapChainSelect from "@/app/[locale]/map/components/map-chain-select";
import MapOpenFilter from "@/app/[locale]/map/components/map-open-filter";
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

/** The filters and the store list the map's search opens into. */
export default function MapPanel({ model, viewArea }: IMapPanelProps) {
  const t = useTranslations("map.layout");
  const { selected, listed } = model;
  // A shared link can name a store the filters hide; it still opens, on top.
  const pinned =
    selected && !listed.some((row) => row.key === selected.key)
      ? [selected]
      : [];
  return (
    <section
      id="map-store-list"
      aria-label={t("storeList")}
      className="flex min-h-0 flex-1 flex-col gap-3 p-3"
    >
      {model.status === "success" ? (
        <>
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
        </>
      ) : (
        <MapLoadState status={model.status} onRetry={() => model.retry()} />
      )}
    </section>
  );
}
