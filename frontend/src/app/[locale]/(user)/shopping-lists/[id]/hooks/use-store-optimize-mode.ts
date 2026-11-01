"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  isStoreOptimizeMode,
  type StoreOptimizeMode,
} from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-utils";
import {
  isFailure,
  useDistanceSort,
} from "@/app/[locale]/products/hooks/use-distance-sort";
import {
  getStoreOptimizeMode,
  setStoreOptimizeMode,
} from "@/utils/browser/local-storage";
import { isGeolocationGranted } from "@/utils/browser/geolocation-permission";

/**
 * The store list sort, saved across lists. A saved "distance" comes back only
 * when the browser already allows location, so loading a list never prompts;
 * otherwise the list opens in the default order.
 */
export function useStoreOptimizeMode() {
  const [saved] = useState(() => {
    const stored = getStoreOptimizeMode();

    return isStoreOptimizeMode(stored) ? stored : "products";
  });
  const distance = useDistanceSort<StoreOptimizeMode>(
    saved === "distance" ? "products" : saved,
    "products",
  );
  // A pick made while the permission query runs beats the restore.
  const picked = useRef(false);

  const restoreDistance = useEffectEvent(() => {
    if (!picked.current) distance.choose("distance");
  });

  useEffect(() => {
    if (saved !== "distance") return;

    let cancelled = false;
    void isGeolocationGranted().then((granted) => {
      if (granted && !cancelled) restoreDistance();
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

  return { ...distance, choose };
}
