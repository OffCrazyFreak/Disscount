"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useStoreDirectory } from "@/lib/api/store-directory";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import {
  type INearestStore,
  locatePricedStores,
  nearestStoreByChain,
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
  measured: IMeasuredChains | null,
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
  // Without a fix, a town's centre stands in once store pins can place it; a fix revoked in site settings leaves "located" with no position.
  if (!hasOrigin) return locationFailure;
  if (!measured) return "locating";

  return measured.nearest.size > 0 ? "ready" : "noStores";
}

interface IMeasuredChains {
  nearest: Map<string, INearestStore>;
  distances: Map<string, number>;
}

function measureChains(
  lat: number | undefined,
  lon: number | undefined,
  stores: DirectoryStoreDto[] | undefined,
  pricedStores: StorePrice[] | null | undefined,
): IMeasuredChains | null {
  if (lat === undefined || lon === undefined) return null;
  if (!stores || pricedStores === null) return null;

  const nearest = nearestStoreByChain(
    { lat, lon },
    pricedStores ? locatePricedStores(pricedStores, stores) : stores,
  );
  const distances = new Map(
    [...nearest].map(([chain, store]) => [chain, store.km]),
  );

  return { nearest, distances };
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
  measured: IMeasuredChains | null;
}

function readSortResult<TMode extends string>({
  state,
  chosen,
  fallback,
  isFromTown,
  origin,
  measured,
}: ISortResultInput<TMode>) {
  const isReady = state === "ready";
  const selected = chosen === "distance";
  const distanceByChain = measured?.distances;
  // A town centre is no place to measure from, so only a fix shows kilometres or names a nearest store.
  const isShown = isReady && origin?.source === "gps";

  return {
    sortMode: selected && !isReady ? fallback : chosen,
    origin: isReady || (selected && isFromTown) ? origin : null,
    distanceByChain: (isReady && distanceByChain) || undefined,
    shownNearestStores: (isShown && measured?.nearest) || undefined,
  };
}

// A tap that failed keeps its watch open, and a fix after the note gave up or a town took over would quietly disagree with it.
function useStopLocating(isDone: boolean, clear: () => void) {
  const stop = useEffectEvent(clear);

  useEffect(() => {
    if (isDone) stop();
  }, [isDone]);
}

interface IDistanceSortOptions {
  /** Null while the prices load; left out, every store in the directory counts. */
  pricedStores?: StorePrice[] | null;
}

/** Fetched only once the shopper picks distance; a failure keeps its reason until the next pick, so picking again retries. */
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
  const { origin, towns, pickTown, hasKnownTown } = useDistanceOrigin(
    stores,
    gps.position,
  );

  const lat = origin?.lat;
  const lon = origin?.lon;
  const measured = useMemo(
    () => measureChains(lat, lon, stores, pricedStores),
    [lat, lon, stores, pricedStores],
  );

  const state = selected
    ? readState(gps.status, origin != null, directory, measured)
    : (failure ?? "idle");

  // Adjusted while rendering, as React documents, so the select never shows "distance" for an order it is not using.
  if (selected && isFailure(state)) {
    setChosen(fallback);
    setFailure(state);
  }

  // A town standing in for a failed location is kept like a picked one, because a late fix would reorder the list and unmount the open picker.
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

  function chooseKnownTown() {
    location.clear();
    setIsFromTown(true);
    setFailure(null);
    setChosen("distance" as TMode);
  }

  function chooseTown(town: string) {
    pickTown(town);
    chooseKnownTown();
  }

  return {
    chosen,
    choose,
    chooseTown,
    chooseKnownTown,
    hasKnownTown,
    towns,
    state,
    ...readSortResult({
      state,
      chosen,
      fallback,
      isFromTown,
      origin,
      measured,
    }),
  };
}
