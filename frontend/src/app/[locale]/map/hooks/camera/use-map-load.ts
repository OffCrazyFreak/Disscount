"use client";

import { RefObject, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";

import { foldAttributionLater } from "@/app/[locale]/map/utils/rendering/attribution";
import {
  releaseInstallBannerHold,
  useInstallBannerHold,
} from "@/components/custom/pwa/install-banner-hold";
import { registerChainIcons } from "@/app/[locale]/map/utils/rendering/register-chain-icons";

// Lifted when the credits fold, since the licences need them in sight first.
const CREDITS_HOLD = "map-credits";

interface IUseMapLoadOptions {
  mapRef: RefObject<MapRef | null>;
  chains: string[];
  onContextLost: () => void;
}

export function useMapLoad({
  mapRef,
  chains,
  onContextLost,
}: IUseMapLoadOptions) {
  const [mapReady, setMapReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  useInstallBannerHold(CREDITS_HOLD, true);

  async function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // A store picked before the map loaded (a shared link) still gets centred.
    setMapReady(true);

    // MapLibre bug #8690: a context lost early leaves a blank map, so offer a reload.
    map.getCanvas().addEventListener("webglcontextlost", onContextLost);

    foldAttributionLater(map, () => releaseInstallBannerHold(CREDITS_HOLD));

    await registerChainIcons(map, chains);
    setIconsReady(true);
  }

  return { mapReady, iconsReady, handleLoad };
}
