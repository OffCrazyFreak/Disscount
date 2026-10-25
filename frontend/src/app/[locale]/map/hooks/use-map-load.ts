"use client";

import { RefObject, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { foldAttributionLater } from "@/app/[locale]/map/utils/attribution";
import { registerChainIcons } from "@/app/[locale]/map/utils/register-chain-icons";

interface IUseMapLoadOptions {
  mapRef: RefObject<MapRef | null>;
  chains: string[];
  onContextLost: () => void;
}

/** One-time setup once the map loads: listeners, credits and store icons. */
export function useMapLoad({
  mapRef,
  chains,
  onContextLost,
}: IUseMapLoadOptions) {
  const [mapReady, setMapReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  async function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // A store picked before the map loaded (a shared link) still gets centred.
    setMapReady(true);

    // Known MapLibre bug (#8690): a context lost early leaves a blank map, so
    // offer a reload rather than a grey rectangle.
    map.getCanvas().addEventListener("webglcontextlost", onContextLost);

    foldAttributionLater(map);

    await registerChainIcons(map, chains);
    setIconsReady(true);
  }

  return { mapReady, iconsReady, handleLoad };
}
