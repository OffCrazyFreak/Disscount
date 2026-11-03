"use client";

import { useDistanceOrigin } from "@/hooks/use-distance-origin";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import { useStoreDirectory } from "@/lib/api/store-directory";
import { useStoreHoursNow } from "@/components/custom/store-hours/use-store-hours-now";
import { openingOf } from "@/lib/store-hours/store-opening";
import { useGeolocation } from "@/hooks/use-geolocation";
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
import { passesOpenFilter } from "@/app/[locale]/map/utils/open-filter";
import { toStoreKey } from "@/utils/store-key";

/** Everything the map page renders, derived from the data, the URL and the user. */
export function useMapViewModel(ipLocation: IIpLocation | null) {
  const directory = useStoreDirectory();
  const hours = useStoreHoursNow();
  const url = useMapUrlState();
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

  // Until the hours load, the filter waits rather than emptying the list.
  function keep(store: (typeof stores)[number]) {
    if (!hours || url.openFilter === "off") return true;

    return passesOpenFilter(
      openingOf(toStoreKey(store.chain, store.code), hours),
      url.openFilter,
    );
  }

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
