"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  isStoreOptimizeMode,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import { isFailure, useDistanceSort } from "@/hooks/use-distance-sort";
import {
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";
import { isGeolocationGranted } from "@/utils/browser/geolocation-permission";

/**
 * The store list sort, saved across lists. A saved "distance" comes back from
 * the location when the browser already allows it, else from a picked or saved
 * town, so loading a list never prompts; otherwise the list opens in the
 * default order.
 */
export function useStoreOptimizeMode() {
  const [saved] = useState(() => {
    const stored = getStoreOptimizeMode();

    return isStoreOptimizeMode(stored) ? stored : "products";
  });
  // No per-store prices here, so each chain's nearest store of any kind.
  const distance = useDistanceSort<StoreOptimizeMode>(
    saved === "distance" ? "products" : saved,
    "products",
  );
  // A pick made while the permission query runs beats the restore.
  const picked = useRef(false);

  const restoreDistance = useEffectEvent((granted: boolean) => {
    if (picked.current) return;
    if (granted) distance.choose("distance");
    else if (distance.hasKnownTown) distance.chooseKnownTown();
  });

  useEffect(() => {
    if (saved !== "distance") return;

    let cancelled = false;
    void isGeolocationGranted().then((granted) => {
      if (!cancelled) restoreDistance(granted);
    });

    return () => {
      cancelled = true;
    };
  }, [saved]);

  // "distance" is saved only once it worked, so a failed pick keeps the
  // earlier choice, and a failed restore stops retrying on every visit.
  useEffect(() => {
    if (distance.state === "ready") setStoreOptimizeMode("distance");
    else if (
      isFailure(distance.state) &&
      getStoreOptimizeMode() === "distance"
    ) {
      setStoreOptimizeMode("products");
    }
  }, [distance.state]);

  function choose(mode: StoreOptimizeMode) {
    picked.current = true;
    distance.choose(mode);
    if (mode !== "distance") setStoreOptimizeMode(mode);
  }

  function chooseTown(town: string) {
    picked.current = true;
    distance.chooseTown(town);
  }

  return { ...distance, choose, chooseTown };
}
