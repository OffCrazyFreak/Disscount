"use client";

import { DirectoryStoreDto } from "@/lib/api/schemas";
import { ALL_CHAINS } from "@/app/[locale]/map/hooks/use-map-url-state";
import { distanceKm, ILatLon } from "@/app/[locale]/map/utils/distance";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";
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

/** A store with the labels and distance the list and the card display. */
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
}

/**
 * The stores the list and the map show: filtered by chain and search, nearest
 * first once there is a position, otherwise alphabetical. Stores without
 * coordinates stay in the list, they just cannot be pinned.
 */
export function useVisibleStores({
  stores,
  chains,
  query,
  origin,
}: IUseVisibleStoresOptions) {
  const inChains =
    chains === ALL_CHAINS
      ? stores
      : stores.filter((store) => chains.includes(store.chain));

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

  const mappable = listed.filter(
    (row) => row.store.lat != null && row.store.lon != null,
  );

  return { listed, mappable, unplacedCount: listed.length - mappable.length };
}
