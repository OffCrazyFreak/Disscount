"use client";

import { RefObject, useEffect, useEffectEvent } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { IViewArea, readVisibleArea } from "@/features/map/utils/view-area";

interface IUseViewReportOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  /** Pixels at the map's bottom under the phone sheet or nav, 0 on desktop. */
  coveredHeight: number;
  onViewChange: (area: IViewArea | null) => void;
}

export function useViewReport({
  mapRef,
  mapReady,
  coveredHeight,
  onViewChange,
}: IUseViewReportOptions) {
  function coveredBottom() {
    const map = mapRef.current?.getMap();
    return map ? Math.min(coveredHeight, map.getCanvas().clientHeight) : 0;
  }

  function reportView() {
    const map = mapRef.current?.getMap();
    if (map) onViewChange(readVisibleArea(map, coveredBottom()));
  }

  const reportChangedView = useEffectEvent(reportView);

  // The sheet moving changes how much of the map is in sight.
  useEffect(() => {
    if (mapReady) reportChangedView();
  }, [mapReady, coveredHeight]);

  return { coveredBottom, reportView };
}
