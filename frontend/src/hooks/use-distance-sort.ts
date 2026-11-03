"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useStoreDirectory } from "@/lib/api/store-directory";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import {
  locatePricedStores,
  nearestDistanceByChain,
} from "@/utils/nearest-chain-distance";
import {
  useGeolocation,
  type GeolocationStatus,
} from "@/hooks/use-geolocation";
import {
  useDistanceOrigin,
  type IDistanceOrigin,
} from "@/hooks/use-distance-origin";

export type DistanceSortState =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unavailable"
  | "timeout"
  | "noStores";

type DistanceSortFailure = "denied" | "unavailable" | "timeout" | "noStores";

export function isFailure(
  state: DistanceSortState,
): state is DistanceSortFailure {
  return (
    state === "denied" ||
    state === "unavailable" ||
    state === "timeout" ||
    state === "noStores"
  );
}

interface IDirectoryQuery {
  data?: unknown;
  isError: boolean;
  isFetching: boolean;
}

function readState(
  locationStatus: GeolocationStatus,
  hasOrigin: boolean,
  directory: IDirectoryQuery,
  distanceByChain: Map<string, number> | null,
): DistanceSortState {
  if (locationStatus === "idle" || locationStatus === "locating") {
    return locationStatus;
  }

  const isLocated = locationStatus === "located";
  // "approximate" needs an IP guess, which this hook never passes.
  const locationFailure =
    locationStatus === "denied" || locationStatus === "timeout"
      ? locationStatus
      : "unavailable";

  if (!directory.data) {
    if (directory.isFetching || !directory.isError) return "locating";

    return isLocated ? "noStores" : locationFailure;
  }
  // Without a fix, a town's centre stands in once the store pins can place it.
  // A fix revoked in the site settings leaves "located" with no position.
  if (!hasOrigin) return locationFailure;
  if (!distanceByChain) return "locating";

  return distanceByChain.size > 0 ? "ready" : "noStores";
}

function measureChains(
  lat: number | undefined,
  lon: number | undefined,
  stores: DirectoryStoreDto[] | undefined,
  pricedStores: StorePrice[] | null | undefined,
): Map<string, number> | null {
  if (lat === undefined || lon === undefined) return null;
  if (!stores || pricedStores === null) return null;

  return nearestDistanceByChain(
    { lat, lon },
    pricedStores ? locatePricedStores(pricedStores, stores) : stores,
  );
}

function isStandInTown(
  isFromTown: boolean,
  state: DistanceSortState,
  origin: IDistanceOrigin | null,
) {
  return !isFromTown && state === "ready" && origin?.source !== "gps";
}

interface ISortResultInput<TMode> {
  state: DistanceSortState;
  chosen: TMode;
  fallback: TMode;
  isFromTown: boolean;
  origin: IDistanceOrigin | null;
  distanceByChain: Map<string, number> | null;
}

function readSortResult<TMode extends string>({
  state,
  chosen,
  fallback,
  isFromTown,
  origin,
  distanceByChain,
}: ISortResultInput<TMode>) {
  const isReady = state === "ready";
  const selected = chosen === "distance";

  return {
    sortMode: selected && !isReady ? fallback : chosen,
    origin: isReady || (selected && isFromTown) ? origin : null,
    distanceByChain: (isReady && distanceByChain) || undefined,
    // A town centre is no place to measure from, so only a fix shows kilometres.
    shownDistances:
      (isReady && origin?.source === "gps" && distanceByChain) || undefined,
  };
}

// A tap that failed keeps its watch open, and a fix after the note gave up
// or a town took over would quietly disagree with it.
function useStopLocating(isDone: boolean, clear: () => void) {
  const stop = useEffectEvent(clear);

  useEffect(() => {
    if (isDone) stop();
  }, [isDone]);
}

interface IDistanceSortOptions {
  /**
   * Measure only the stores that priced a product. Null while the prices
   * load; left out, every store in the directory counts.
   */
  pricedStores?: StorePrice[] | null;
}

/**
 * The chosen sort, and the location and store pins a "distance" sort needs,
 * fetched only once the shopper picks it. Until the location, the pins and
 * any priced stores are in, the list keeps the fallback order. Without a fix,
 * distances start from a picked or saved town instead. When that fails too or
 * no store is located, the choice returns to the fallback and the reason
 * stays until the next pick, so picking "distance" again retries.
 */
export function useDistanceSort<TMode extends string>(
  initial: TMode,
  fallback: TMode,
  { pricedStores }: IDistanceSortOptions = {},
) {
  const [chosen, setChosen] = useState(initial);
  const [failure, setFailure] = useState<DistanceSortFailure | null>(null);
  // A town replaces the location outright, so a late fix cannot override it.
  const [isFromTown, setIsFromTown] = useState(false);
  const selected = chosen === "distance";
  const location = useGeolocation(null);
  const directory = useStoreDirectory({ enabled: selected });
  const stores = directory.data?.stores;
  // Null whenever the status is a failure: only a tap with no fix can fail.
  const gps = isFromTown
    ? { status: "unavailable" as const, position: null }
    : location;
  const { origin, towns, pickTown } = useDistanceOrigin(stores, gps.position);

  const lat = origin?.lat;
  const lon = origin?.lon;
  const distanceByChain = useMemo(
    () => measureChains(lat, lon, stores, pricedStores),
    [lat, lon, stores, pricedStores],
  );

  const state = selected
    ? readState(gps.status, origin != null, directory, distanceByChain)
    : (failure ?? "idle");

  // Adjusting state while rendering, as React documents for derived resets,
  // so the select never shows "distance" for an order it is not using.
  if (selected && isFailure(state)) {
    setChosen(fallback);
    setFailure(state);
  }

  // A town standing in for a failed location is kept like a picked one: a late
  // fix would reorder the list under the shopper and unmount the open picker.
  if (isStandInTown(isFromTown, state, origin)) setIsFromTown(true);

  useStopLocating(failure != null || isFromTown, location.clear);

  function choose(mode: TMode) {
    setFailure(null);
    setIsFromTown(false);
    setChosen(mode);
    // The position is read only while it orders the list.
    if (mode !== "distance") {
      location.clear();
      return;
    }

    // Asked on the pick itself, so the prompt follows a clear intent.
    location.locate();
    if (directory.isError) void directory.refetch();
  }

  // A town is picked instead of the location, so it sorts without asking again.
  function chooseTown(town: string) {
    location.clear();
    pickTown(town);
    setIsFromTown(true);
    setFailure(null);
    setChosen("distance" as TMode);
  }

  return {
    chosen,
    choose,
    chooseTown,
    towns,
    state,
    ...readSortResult({
      state,
      chosen,
      fallback,
      isFromTown,
      origin,
      distanceByChain,
    }),
  };
}
