"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import MapChainSource from "@/app/[locale]/map/components/map-chain-source";
import MapOverlays from "@/app/[locale]/map/components/map-overlays";
import MapPanControls from "@/app/[locale]/map/components/map-pan-controls";
import MapUnavailable from "@/app/[locale]/map/components/map-unavailable";
import { ICenterRequest } from "@/app/[locale]/map/hooks/use-geolocation";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { groupStoresByChain } from "@/app/[locale]/map/utils/chain-geojson";
import { interactiveLayerIds } from "@/app/[locale]/map/utils/chain-layers";
import { ILatLon } from "@/app/[locale]/map/utils/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/app/[locale]/map/utils/map-attribution";
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

const CROATIA_BOUNDS: [number, number, number, number] = [
  13.4, 42.3, 19.5, 46.6,
];
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
  // Set by a drag, wheel or key, never by our own easeTo calls.
  const userMoved = useRef(false);
  const gpsCentered = useRef(false);
  // A shared #map= link names its own view, which only an explicit tap replaces.
  const [openedWithView] = useState(() =>
    window.location.hash.startsWith("#map="),
  );

  const style = useQuery({
    queryKey: ["map-style"],
    queryFn: ({ signal }) => loadMapStyle(signal),
    staleTime: Infinity,
  });

  const groups = groupStoresByChain(stores.map((row) => row.store));
  const chains = [...groups.keys()];

  const selectedPoint =
    selected?.store.lat != null && selected.store.lon != null
      ? { lat: selected.store.lat, lon: selected.store.lon }
      : null;

  const selectedLat = selectedPoint?.lat;
  const selectedLon = selectedPoint?.lon;

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || selectedLat == null || selectedLon == null) return;

    // easeTo snaps instantly under prefers-reduced-motion, as long as the
    // animation is not marked essential.
    map.easeTo({
      center: [selectedLon, selectedLat],
      zoom: Math.max(map.getZoom(), 15),
    });
  }, [mapReady, selectedLat, selectedLon]);

  const hasSelection = selectedLat != null;

  useEffect(() => {
    if (!mapReady || !centerRequest) return;

    // A fix nobody tapped for must not yank the map from where the user moved
    // it, or from the store a shared link opened.
    if (
      centerRequest.auto &&
      (userMoved.current || hasSelection || openedWithView)
    ) {
      return;
    }

    gpsCentered.current = true;
    mapRef.current?.easeTo({
      center: [centerRequest.lon, centerRequest.lat],
      zoom: 13,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, centerRequest]);

  // The pinned place needs the profile and the store list, which can arrive
  // after the map has already opened on the IP guess or all of Croatia.
  useEffect(() => {
    if (!mapReady || !initialView) return;
    if (userMoved.current || gpsCentered.current) return;
    if (hasSelection || openedWithView) return;

    mapRef.current?.jumpTo({
      center: [initialView.lon, initialView.lat],
      zoom: initialView.zoom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, initialView?.lat, initialView?.lon, initialView?.zoom]);

  function handleMoveStart(event: ViewStateChangeEvent) {
    if (event.originalEvent) userMoved.current = true;
  }

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

  async function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature) return;

    const properties = feature.properties ?? {};

    if (properties.cluster_id != null && feature.source) {
      const map = mapRef.current?.getMap();
      const source = map?.getSource(feature.source);

      if (map && source instanceof maplibregl.GeoJSONSource) {
        const zoom = await source.getClusterExpansionZoom(
          properties.cluster_id,
        );
        map.easeTo({ center: event.lngLat, zoom });
      }

      return;
    }

    if (typeof properties.key === "string") onSelect(properties.key);
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
      initialViewState={
        initialView
          ? {
              latitude: initialView.lat,
              longitude: initialView.lon,
              zoom: initialView.zoom,
            }
          : { bounds: CROATIA_BOUNDS }
      }
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
