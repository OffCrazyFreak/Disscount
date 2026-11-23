"use client";

import { useDistanceOrigin } from "@/hooks/geo/use-distance-origin";
import { useSearchNavigation } from "@/hooks/state/use-search-navigation";
import { useStoreDirectory } from "@/lib/api/store-directory";
import { useGeolocation } from "@/hooks/geo/use-geolocation";
import { useMapDefaults } from "@/features/map/hooks/use-map-defaults";
import { useMapHours } from "@/features/map/hooks/use-map-hours";
import {
  ALL_CHAINS,
  useMapUrlState,
} from "@/features/map/hooks/use-map-url-state";
import { useRecentSearches } from "@/features/map/hooks/use-recent-searches";
import { useVisibleStores } from "@/features/map/hooks/use-visible-stores";
import { resolveMapOrigin } from "@/features/map/utils/view/map-origin";
import type { IIpLocation } from "@/features/map/utils/view/ip-location";
import {
  findSelectedStore,
  resolveInitialView,
} from "@/features/map/utils/view/map-view";
import { isVisitableStore } from "@/features/map/utils/stores/visitable-store";

export function useMapViewModel(ipLocation: IIpLocation | null) {
  const directory = useStoreDirectory();
  const url = useMapUrlState();
  const { hours, hasHoursFailed, retryHours, keep } = useMapHours(
    url.openFilter,
  );
  const geolocation = useGeolocation(ipLocation, { watchWhenAllowed: true });
  const { search } = useSearchNavigation("/map", { shallow: true });

  const stores = (directory.data?.stores ?? []).filter(isVisitableStore);

  const defaults = useMapDefaults(stores);
  const chains = url.chainFilter ?? defaults.defaultChains ?? ALL_CHAINS;
  const { town } = useDistanceOrigin(stores, geolocation.position);

  const origin = resolveMapOrigin(
    geolocation.position,
    geolocation.guess,
    town,
    ipLocation,
  );

  const { listed, mappable, unplacedCount } = useVisibleStores({
    keep,
    stores,
    chains,
    query: url.query,
    origin: origin.origin,
    showDistances: origin.showDistances,
  });

  const recent = useRecentSearches(url.query, listed.length > 0);

  return {
    status: directory.status,
    retry: directory.refetch,
    chainCodes: [...new Set(stores.map((store) => store.chain))],
    chains,
    query: url.query,
    hours,
    hasHoursFailed,
    retryHours,
    openFilter: url.openFilter,
    setOpenFilter: url.setOpenFilter,
    listed,
    mappable,
    unplacedCount,
    selected: findSelectedStore(stores, url.selectedKey, origin),
    initialView: resolveInitialView(town, ipLocation),
    origin,
    geolocation,
    recentSearches: recent.recent,
    clearRecentSearches: recent.clear,
    search,
    selectStore: url.selectStore,
    setChainFilter: url.setChainFilter,
  };
}

export type IMapViewModel = ReturnType<typeof useMapViewModel>;
