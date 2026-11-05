"use client";

import { RefObject, useState } from "react";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";

import {
  handleMapFeature,
  handleMapFeatureClick,
  IMapFeatureRef,
  ISameSpot,
} from "@/app/[locale]/map/utils/map-feature-click";

interface IUseMapClicksOptions {
  mapRef: RefObject<MapRef | null>;
  onSelect: (key: string) => void;
  coveredBottom: () => number;
}

/** Store and stack taps, and the list a same-spot stack opens. */
export function useMapClicks({
  mapRef,
  onSelect,
  coveredBottom,
}: IUseMapClicksOptions) {
  const [sameSpot, setSameSpot] = useState<ISameSpot | null>(null);

  function actions() {
    return {
      onSelect,
      onSameSpot: setSameSpot,
      coveredBottom: coveredBottom(),
    };
  }

  function handleClick(event: MapLayerMouseEvent) {
    return handleMapFeatureClick(event, mapRef.current, actions());
  }

  function handleStack(feature: IMapFeatureRef) {
    return handleMapFeature(feature, mapRef.current, actions());
  }

  function selectFromSpot(key: string) {
    setSameSpot(null);
    onSelect(key);
  }

  return {
    sameSpot,
    closeSpot: () => setSameSpot(null),
    selectFromSpot,
    handleClick,
    handleStack,
  };
}
