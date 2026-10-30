"use client";

import { useEffect, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { ILatLon } from "@/app/[locale]/map/utils/distance";
import {
  findSelectedFrame,
  ISelectedFrame,
  sameFrame,
} from "@/app/[locale]/map/utils/selected-frame";

interface IUseSelectedFrameOptions {
  map: MapRef | undefined;
  /** True once the store layers exist, so they can be queried. */
  ready: boolean;
  selectedKey: string | null;
  selectedPoint: ILatLon | null;
}

/** Keeps the selection frame on whatever the selected store is drawn as. */
export function useSelectedFrame({
  map: mapRef,
  ready,
  selectedKey,
  selectedPoint,
}: IUseSelectedFrameOptions) {
  // Tagged with its store, so a frame left from an earlier pick never shows.
  const [located, setLocated] = useState<{
    key: string;
    frame: ISelectedFrame | null;
  } | null>(null);

  const lat = selectedPoint?.lat;
  const lon = selectedPoint?.lon;

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!ready || !map || !selectedKey || lat == null || lon == null) return;

    const instance = map;
    const key = selectedKey;
    const point = { lat, lon };
    let cancelled = false;
    let latestRun = 0;

    // "idle" fires once tiles and clusters for the new view are drawn, which
    // a plain moveend can beat. An unchanged frame keeps its object, so the
    // overlay does not redraw and fire idle again.
    async function locate() {
      const run = ++latestRun;
      let next: ISelectedFrame | null;

      try {
        next = await findSelectedFrame(instance, key, point);
      } catch {
        // A filter change can retire a cluster mid-lookup; the next idle
        // looks again.
        return;
      }

      // Lookups can finish out of order; only the newest view counts.
      if (cancelled || run !== latestRun) return;

      setLocated((current) =>
        current?.key === key && sameFrame(current.frame, next)
          ? current
          : { key, frame: next },
      );
    }

    locate();
    map.on("idle", locate);

    return () => {
      cancelled = true;
      map.off("idle", locate);
    };
  }, [mapRef, ready, selectedKey, lat, lon]);

  return located && located.key === selectedKey ? located.frame : null;
}
