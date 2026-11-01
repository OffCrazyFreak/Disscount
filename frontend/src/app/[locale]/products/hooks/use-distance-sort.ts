"use client";

import { useState } from "react";
import { useStoreDirectory } from "@/lib/api/store-directory";
import {
  useCurrentPosition,
  type CurrentPositionStatus,
} from "@/hooks/use-current-position";

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
  locationStatus: CurrentPositionStatus,
  directory: IDirectoryQuery,
): DistanceSortState {
  if (locationStatus !== "located") return locationStatus;
  if (directory.data) return "ready";

  return directory.isError && !directory.isFetching ? "noStores" : "locating";
}

/**
 * The chosen sort, and the location and store pins a "distance" sort needs,
 * fetched only once the shopper picks it. Until both are in, the list keeps
 * the fallback order; when either fails, the choice returns to the fallback
 * and the reason stays until the next pick, so picking "distance" again
 * retries.
 */
export function useDistanceSort<TMode extends string>(
  initial: TMode,
  fallback: TMode,
) {
  const [chosen, setChosen] = useState(initial);
  const [failure, setFailure] = useState<DistanceSortFailure | null>(null);
  const selected = chosen === "distance";
  const location = useCurrentPosition();
  const directory = useStoreDirectory({ enabled: selected });

  const state = selected
    ? readState(location.status, directory)
    : (failure ?? "idle");

  // Adjusting state while rendering, as React documents for derived resets,
  // so the select never shows "distance" for an order it is not using.
  if (selected && isFailure(state)) {
    setChosen(fallback);
    setFailure(state);
  }

  function choose(mode: TMode) {
    setFailure(null);
    setChosen(mode);
    if (mode !== "distance") return;

    // Asked on the pick itself, so the prompt follows a clear intent.
    location.request();
    if (directory.isError) void directory.refetch();
  }

  return {
    chosen,
    choose,
    state,
    sortMode: selected && state !== "ready" ? fallback : chosen,
    origin: state === "ready" ? location.position : null,
    stores: directory.data?.stores,
  };
}
