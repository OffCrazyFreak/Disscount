"use client";

import { RefObject, useEffect } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import {
  IViewBounds,
  readVisibleBounds,
} from "@/app/[locale]/map/utils/view-bounds";

interface IUseViewReportOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  /** Share of the map's height under the phone sheet, 0 on desktop. */
  coveredShare: number;
  onViewChange: (bounds: IViewBounds | null) => void;
}

/** Tells the list which part of the map is actually in sight. */
export function useViewReport({
  mapRef,
  mapReady,
  coveredShare,
  onViewChange,
}: IUseViewReportOptions) {
  function coveredBottom() {
    const map = mapRef.current?.getMap();
    return map ? map.getCanvas().clientHeight * coveredShare : 0;
  }

  function reportView() {
    const map = mapRef.current?.getMap();
    if (map) onViewChange(readVisibleBounds(map, coveredBottom()));
  }

  // The sheet moving changes how much of the map is in sight.
  useEffect(() => {
    if (mapReady) reportView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, coveredShare]);

  return { coveredBottom, reportView };
}
