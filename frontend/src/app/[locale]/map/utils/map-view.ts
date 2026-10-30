import { DirectoryStoreDto } from "@/lib/api/schemas";
import {
  IListedStore,
  toListedStore,
} from "@/app/[locale]/map/hooks/use-visible-stores";
import { ILatLon } from "@/app/[locale]/map/utils/distance";
import type { IIpLocation } from "@/app/[locale]/map/utils/ip-location";
import { IMapOrigin } from "@/app/[locale]/map/utils/map-origin";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";

export function resolveInitialView(
  placeCenter: ILatLon | null,
  ipLocation: IIpLocation | null,
): (ILatLon & { zoom: number }) | null {
  if (placeCenter) return { ...placeCenter, zoom: 12 };

  // City level: the guess is rarely closer than the town.
  if (ipLocation) return { lat: ipLocation.lat, lon: ipLocation.lon, zoom: 11 };

  return null;
}

// Looked up among all stores, so a shared link opens even when the filters
// would hide that store.
export function findSelectedStore(
  stores: DirectoryStoreDto[],
  selectedKey: string | null,
  origin: IMapOrigin,
): IListedStore | null {
  if (!selectedKey) return null;

  const store = stores.find(
    (candidate) => toStoreKey(candidate.chain, candidate.code) === selectedKey,
  );
  if (!store) return null;

  return toListedStore(store, origin.showDistances ? origin.origin : null);
}

export function toSelectedPoint(selected: IListedStore | null): ILatLon | null {
  if (selected?.store.lat == null || selected.store.lon == null) return null;

  return { lat: selected.store.lat, lon: selected.store.lon };
}

const CROATIA_BOUNDS: [number, number, number, number] = [
  13.4, 42.3, 19.5, 46.6,
];

export function toInitialViewState(
  initialView: (ILatLon & { zoom: number }) | null,
) {
  if (!initialView) return { bounds: CROATIA_BOUNDS };

  return {
    latitude: initialView.lat,
    longitude: initialView.lon,
    zoom: initialView.zoom,
  };
}
