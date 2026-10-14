"use client";

import { useSearchNavigation } from "@/hooks/use-search-navigation";
import { useStoreDirectory } from "@/lib/api/store-directory";
import { useGeolocation } from "@/app/[locale]/map/hooks/use-geolocation";
import { useMapDefaults } from "@/app/[locale]/map/hooks/use-map-defaults";
import {
  ALL_CHAINS,
  useMapUrlState,
} from "@/app/[locale]/map/hooks/use-map-url-state";
import { useRecentSearches } from "@/app/[locale]/map/hooks/use-recent-searches";
import { useVisibleStores } from "@/app/[locale]/map/hooks/use-visible-stores";
import { resolveMapOrigin } from "@/app/[locale]/map/utils/map-origin";
import type { IIpLocation } from "@/app/[locale]/map/utils/ip-location";
import {
  findSelectedStore,
  resolveInitialView,
} from "@/app/[locale]/map/utils/map-view";
import { isVisitableStore } from "@/app/[locale]/map/utils/visitable-store";

/** Everything the map page renders, derived from the data, the URL and the user. */
export function useMapViewModel(ipLocation: IIpLocation | null) {
  const directory = useStoreDirectory();
  const url = useMapUrlState();
  const geolocation = useGeolocation();
  const { search } = useSearchNavigation("/map", { shallow: true });

  const stores = (directory.data?.stores ?? []).filter(isVisitableStore);

  const defaults = useMapDefaults(stores);
  const chains = url.chainFilter ?? defaults.defaultChains ?? ALL_CHAINS;

  const origin = resolveMapOrigin(
    geolocation.position,
    ipLocation,
    defaults.placeCenter != null,
  );

  const { listed, mappable, unplacedCount } = useVisibleStores({
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
    listed,
    mappable,
    unplacedCount,
    selected: findSelectedStore(stores, url.selectedKey, origin),
    initialView: resolveInitialView(defaults.placeCenter, ipLocation),
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
