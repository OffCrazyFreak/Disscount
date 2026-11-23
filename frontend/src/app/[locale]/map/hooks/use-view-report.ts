"use client";

import { RefObject, useEffect, useEffectEvent } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import {
  IMapCover,
  IViewArea,
  readVisibleArea,
} from "@/app/[locale]/map/utils/view-area";

interface IUseViewReportOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  /** What the sheet, nav or search panel hides of the map. */
  cover: IMapCover;
  onViewChange: (area: IViewArea | null) => void;
}

export function useViewReport({
  mapRef,
  mapReady,
  cover,
  onViewChange,
}: IUseViewReportOptions) {
  function visibleCover(): IMapCover {
    const canvas = mapRef.current?.getMap().getCanvas();
    if (!canvas) return { bottom: 0, right: 0 };

    return {
      bottom: Math.min(cover.bottom, canvas.clientHeight),
      right: Math.min(cover.right, canvas.clientWidth),
    };
  }

  function reportView() {
    const map = mapRef.current?.getMap();
    if (map) onViewChange(readVisibleArea(map, visibleCover()));
  }

  const reportChangedView = useEffectEvent(reportView);

  // The sheet or the panel moving changes how much of the map is in sight.
  useEffect(() => {
    if (mapReady) reportChangedView();
  }, [mapReady, cover.bottom, cover.right]);

  return { visibleCover, reportView };
}
