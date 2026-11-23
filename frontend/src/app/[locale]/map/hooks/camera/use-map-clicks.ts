"use client";

import { RefObject, useState } from "react";
import type { MapLayerMouseEvent, MapRef } from "react-map-gl/maplibre";

import {
  handleMapFeature,
  handleMapFeatureClick,
  IMapFeatureRef,
  ISameSpot,
} from "@/app/[locale]/map/utils/rendering/map-feature-click";
import type { IMapCover } from "@/app/[locale]/map/utils/geometry/view-area";

interface IUseMapClicksOptions {
  mapRef: RefObject<MapRef | null>;
  onSelect: (key: string) => void;
  cover: () => IMapCover;
}

export function useMapClicks({
  mapRef,
  onSelect,
  cover,
}: IUseMapClicksOptions) {
  const [sameSpot, setSameSpot] = useState<ISameSpot | null>(null);

  function actions() {
    return {
      onSelect,
      onSameSpot: setSameSpot,
      cover: cover(),
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
