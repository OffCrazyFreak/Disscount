"use client";

import { useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import MapChainSource from "@/app/[locale]/map/components/map-chain-source";
import MapOverlays from "@/app/[locale]/map/components/map-overlays";
import MapPanControls from "@/app/[locale]/map/components/map-pan-controls";
import MapUnavailable from "@/app/[locale]/map/components/map-unavailable";
import { ICenterRequest } from "@/app/[locale]/map/hooks/use-geolocation";
import { useMapCamera } from "@/app/[locale]/map/hooks/use-map-camera";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { groupStoresByChain } from "@/app/[locale]/map/utils/chain-geojson";
import { interactiveLayerIds } from "@/app/[locale]/map/utils/chain-layers";
import { ILatLon } from "@/app/[locale]/map/utils/distance";
import { handleMapFeatureClick } from "@/app/[locale]/map/utils/map-feature-click";
import { MAP_CUSTOM_ATTRIBUTION } from "@/app/[locale]/map/utils/map-attribution";
import {
  toInitialViewState,
  toSelectedPoint,
} from "@/app/[locale]/map/utils/map-view";
import { loadMapStyle } from "@/app/[locale]/map/utils/map-style";
import { registerChainIcons } from "@/app/[locale]/map/utils/register-chain-icons";
import { storeNamesMap } from "@/constants/name-mappings";

// Under webpack, import.meta.url is the only way to hand MapLibre its worker
// file; without it the map mounts but never loads a tile.
maplibregl.setWorkerUrl(
  new URL(
    "maplibre-gl/dist/maplibre-gl-worker.mjs",
    import.meta.url,
  ).toString(),
);

const ALL_CHAINS = Object.keys(storeNamesMap);

interface IStoreMapProps {
  stores: IListedStore[];
  selected: IListedStore | null;
  onSelect: (key: string) => void;
  userLocation: ILatLon | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
}

export default function StoreMap({
  stores,
  selected,
  onSelect,
  userLocation,
  centerRequest,
  initialView,
}: IStoreMapProps) {
  const t = useTranslations("map.unavailable");
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [cursor, setCursor] = useState<string>("");

  const style = useQuery({
    queryKey: ["map-style"],
    queryFn: ({ signal }) => loadMapStyle(signal),
    staleTime: Infinity,
  });

  const groups = groupStoresByChain(stores.map((row) => row.store));
  const chains = [...groups.keys()];

  const selectedPoint = toSelectedPoint(selected);

  const { handleMoveStart } = useMapCamera({
    mapRef,
    mapReady,
    selectedPoint,
    centerRequest,
    initialView,
  });

  async function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // A store picked before the map loaded (a shared link) still gets centred.
    setMapReady(true);

    // Known MapLibre bug (#8690): a context lost early leaves a blank map, so
    // offer a reload rather than a grey rectangle.
    map
      .getCanvas()
      .addEventListener("webglcontextlost", () => setContextLost(true));

    await registerChainIcons(map, ALL_CHAINS);
    setIconsReady(true);
  }

  function handleClick(event: MapLayerMouseEvent) {
    return handleMapFeatureClick(event, mapRef.current, onSelect);
  }

  if (style.isError) {
    return <MapUnavailable message={t("style")} />;
  }

  if (contextLost) {
    return (
      <MapUnavailable
        message={t("contextLost")}
        action={{
          label: t("reload"),
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!style.data)
    return (
      <div
        className="h-full animate-pulse bg-muted motion-reduce:animate-none"
        aria-hidden="true"
      />
    );

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={style.data}
      hash="map"
      initialViewState={toInitialViewState(initialView)}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      interactiveLayerIds={iconsReady ? interactiveLayerIds(chains) : []}
      cursor={cursor}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onLoad={handleLoad}
      onMoveStart={handleMoveStart}
      onClick={handleClick}
    >
      <NavigationControl position="top-right" />
      {/* Top left, because the phone sheet covers the bottom of the map and
          the tile and data credits must stay visible. */}
      <AttributionControl
        position="top-left"
        compact
        customAttribution={MAP_CUSTOM_ATTRIBUTION}
      />
      <MapPanControls mapRef={mapRef} />

      {iconsReady &&
        [...groups].map(([chain, data]) => (
          <MapChainSource key={chain} chain={chain} data={data} />
        ))}

      <MapOverlays selected={selectedPoint} userLocation={userLocation} />
    </Map>
  );
}
