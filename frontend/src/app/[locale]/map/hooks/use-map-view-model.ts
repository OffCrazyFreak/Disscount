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
import {
  toListedStore,
  useVisibleStores,
} from "@/app/[locale]/map/hooks/use-visible-stores";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
import { isVisitableStore } from "@/app/[locale]/map/utils/visitable-store";

/** Everything the map page renders, derived from the data, the URL and the user. */
export function useMapViewModel() {
  const directory = useStoreDirectory();
  const url = useMapUrlState();
  const geolocation = useGeolocation();
  const { search } = useSearchNavigation("/map", { shallow: true });

  const stores = (directory.data?.stores ?? []).filter(isVisitableStore);

  const defaults = useMapDefaults(stores);
  const chains = url.chainFilter ?? defaults.defaultChains ?? ALL_CHAINS;

  const { listed, mappable, unplacedCount } = useVisibleStores({
    stores,
    chains,
    query: url.query,
    origin: geolocation.position,
  });

  const recent = useRecentSearches(url.query, listed.length > 0);

  // Looked up among all stores, so a shared link opens even when the filters
  // would hide that store.
  const selectedStore = url.selectedKey
    ? stores.find(
        (store) => toStoreKey(store.chain, store.code) === url.selectedKey,
      )
    : undefined;

  return {
    status: directory.status,
    retry: directory.refetch,
    chainCodes: [...new Set(stores.map((store) => store.chain))],
    chains,
    query: url.query,
    listed,
    mappable,
    unplacedCount,
    selected: selectedStore
      ? toListedStore(selectedStore, geolocation.position)
      : null,
    placeCenter: defaults.placeCenter,
    geolocation,
    recentSearches: recent.recent,
    clearRecentSearches: recent.clear,
    search,
    selectStore: url.selectStore,
    setChainFilter: url.setChainFilter,
  };
}

export type IMapViewModel = ReturnType<typeof useMapViewModel>;
