"use client";

import { useSyncExternalStore } from "react";
import { useUser } from "@/context/user-context";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { ILatLon } from "@/utils/distance";
import type { County } from "@/constants/counties";
import { listStoreTowns, townCenter } from "@/utils/store-towns";

export type DistanceOriginSource = "gps" | "picked" | "saved";

export interface IDistanceOrigin extends ILatLon {
  source: DistanceOriginSource;
  /** The town the centre belongs to; null for a GPS fix. */
  town: string | null;
  /** Set only when another town shares the name. */
  county: County | null;
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

  return center
    ? {
        lat: center.lat,
        lon: center.lon,
        source,
        town: center.name,
        county: center.county,
      }
    : null;
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
  const { accountUser } = useUser();
  const picked = useSyncExternalStore(subscribe, readPickedTown, () => null);
  const saved = accountUser?.pinnedPlaces?.[0]?.placeApiId ?? null;

  const directory = stores ?? [];
  const town =
    locateTown(directory, picked, "picked") ??
    locateTown(directory, saved, "saved");

  return {
    origin: gps
      ? {
          lat: gps.lat,
          lon: gps.lon,
          source: "gps" as const,
          town: null,
          county: null,
        }
      : town,
    town,
    /** A town is picked or saved, so a sort can start before the stores load. */
    hasKnownTown: picked != null || saved != null,
    towns: listStoreTowns(directory),
    pickTown,
  };
}
