"use client";

import { DirectoryStoreDto } from "@/lib/api/schemas";
import { ALL_CHAINS } from "@/app/[locale]/map/hooks/use-map-url-state";
import { distanceKm, ILatLon } from "@/utils/distance";
import { toStoreKey } from "@/utils/store-key";
import { filterByFields } from "@/utils/generic";
import { getChainLabel, getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

export interface IListedStore {
  key: string;
  store: DirectoryStoreDto;
  chainLabel: string;
  cityLabel: string;
  /** Kilometres from the user, once they shared a position. */
  distanceKm: number | null;
}

export function toListedStore(
  store: DirectoryStoreDto,
  origin: ILatLon | null,
): IListedStore {
  return {
    key: toStoreKey(store.chain, store.code),
    store,
    chainLabel: getChainLabel(store.chain),
    cityLabel: getLocationLabel(store.city, ""),
    distanceKm:
      origin && store.lat != null && store.lon != null
        ? distanceKm(origin, { lat: store.lat, lon: store.lon })
        : null,
  };
}

interface IUseVisibleStoresOptions {
  stores: DirectoryStoreDto[];
  chains: string[] | typeof ALL_CHAINS;
  query: string;
  origin: ILatLon | null;
  /** False for an approximate origin: it still sorts, but shows no km. */
  showDistances: boolean;
  /** A further filter, such as "open now"; left out, the store list keeps its identity. */
  keep?: (store: DirectoryStoreDto) => boolean;
}

/** Stores without coordinates stay in the list, because they just cannot be pinned. */
export function useVisibleStores({
  stores,
  chains,
  query,
  origin,
  showDistances,
  keep,
}: IUseVisibleStoresOptions) {
  const inChains =
    chains === ALL_CHAINS && !keep
      ? stores
      : stores.filter(
          (store) =>
            (chains === ALL_CHAINS || chains.includes(store.chain)) &&
            (keep?.(store) ?? true),
        );

  const rows = inChains.map((store) => ({
    store,
    chainLabel: getChainLabel(store.chain),
    cityLabel: getLocationLabel(store.city, ""),
    address: store.address ?? "",
  }));

  const matched = filterByFields(rows, query, [
    "chainLabel",
    "cityLabel",
    "address",
  ]);

  const listed = matched.map(({ store }) => toListedStore(store, origin));

  if (origin) {
    listed.sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    );
  } else if (!query.trim()) {
    listed.sort(
      (a, b) =>
        compareHr(a.cityLabel, b.cityLabel) ||
        compareHr(a.chainLabel, b.chainLabel) ||
        compareHr(a.store.address ?? "", b.store.address ?? ""),
    );
  }

  if (!showDistances) {
    for (const row of listed) row.distanceKm = null;
  }

  const mappable = listed.filter(
    (row) => row.store.lat != null && row.store.lon != null,
  );

  return { listed, mappable, unplacedCount: listed.length - mappable.length };
}
