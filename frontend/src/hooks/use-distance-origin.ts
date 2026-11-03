"use client";

import { useSyncExternalStore } from "react";
import { useUser } from "@/context/user-context";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { ILatLon } from "@/utils/distance";
import { listStoreTowns, townCenter } from "@/utils/store-towns";

export type DistanceOriginSource = "gps" | "picked" | "saved";

export interface IDistanceOrigin extends ILatLon {
  source: DistanceOriginSource;
  /** The town the centre belongs to; null for a GPS fix. */
  town: string | null;
}

// Module memory, not storage: a picked town lasts until the tab reloads and
// is never saved or sent, as with the position itself.
let pickedTown: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function readPickedTown() {
  return pickedTown;
}

function pickTown(town: string | null) {
  pickedTown = town;
  listeners.forEach((listener) => listener());
}

function locateTown(
  stores: DirectoryStoreDto[],
  town: string | null,
  source: DistanceOriginSource,
): IDistanceOrigin | null {
  const center = town ? townCenter(stores, town) : null;

  return center && town ? { ...center, source, town } : null;
}

/**
 * Where distances start from, shared by the map and distance sorting: a GPS
 * fix, else a town picked this session, else the first saved place. Towns
 * become points from the store directory alone, so nothing is geocoded.
 */
export function useDistanceOrigin(
  stores: DirectoryStoreDto[] | undefined,
  gps: ILatLon | null,
) {
  const { user } = useUser();
  const picked = useSyncExternalStore(subscribe, readPickedTown, () => null);
  const saved = user?.pinnedPlaces?.[0]?.placeApiId ?? null;

  const directory = stores ?? [];
  const town =
    locateTown(directory, picked, "picked") ??
    locateTown(directory, saved, "saved");

  return {
    origin: gps
      ? { lat: gps.lat, lon: gps.lon, source: "gps" as const, town: null }
      : town,
    town,
    towns: listStoreTowns(directory),
    pickTown,
  };
}
