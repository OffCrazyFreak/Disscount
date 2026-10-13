"use client";

import { useUser } from "@/context/user-context";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { ILatLon } from "@/app/map/utils/distance";
import { getLocationLabel } from "@/utils/labels";
import { isPinnedChain } from "@/utils/pinned-stores";

/**
 * Starting point for a signed-in user: their pinned chains preselected, and
 * the map on their first pinned place. Places are saved as city names, so the
 * centre is the middle of that city's known stores, which needs no geocoder.
 */
export function useMapDefaults(stores: DirectoryStoreDto[]) {
  const { user } = useUser();

  const pinnedNames =
    user?.pinnedStores?.map((pinned) => pinned.storeApiId) ?? [];
  const chainCodes = [...new Set(stores.map((store) => store.chain))];
  const pinnedChains = chainCodes.filter((chain) =>
    isPinnedChain(chain, pinnedNames),
  );

  const pinnedPlace = user?.pinnedPlaces?.[0]?.placeApiId ?? null;
  const placeStores = pinnedPlace
    ? stores.filter(
        (store) =>
          store.lat != null &&
          store.lon != null &&
          getLocationLabel(store.city) === pinnedPlace,
      )
    : [];

  const placeCenter: ILatLon | null =
    placeStores.length > 0
      ? {
          lat:
            placeStores.reduce((sum, store) => sum + (store.lat ?? 0), 0) /
            placeStores.length,
          lon:
            placeStores.reduce((sum, store) => sum + (store.lon ?? 0), 0) /
            placeStores.length,
        }
      : null;

  return {
    defaultChains: pinnedChains.length > 0 ? pinnedChains : null,
    placeCenter,
  };
}
