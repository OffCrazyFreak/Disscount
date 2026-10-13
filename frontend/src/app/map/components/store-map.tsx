"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map,
  NavigationControl,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { useQuery } from "@tanstack/react-query";

import MapChainSource from "@/app/map/components/map-chain-source";
import MapOverlays from "@/app/map/components/map-overlays";
import MapPanControls from "@/app/map/components/map-pan-controls";
import MapUnavailable from "@/app/map/components/map-unavailable";
import { IListedStore } from "@/app/map/hooks/use-visible-stores";
import { groupStoresByChain } from "@/app/map/utils/chain-geojson";
import { interactiveLayerIds } from "@/app/map/utils/chain-layers";
import { ILatLon } from "@/app/map/utils/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/app/map/utils/map-attribution";
import { loadMapStyle } from "@/app/map/utils/map-style";
import { registerChainIcons } from "@/app/map/utils/register-chain-icons";
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
  initialCenter: ILatLon | null;
}

export default function StoreMap({
  stores,
  selected,
  onSelect,
  userLocation,
  initialCenter,
}: IStoreMapProps) {
  const mapRef = useRef<MapRef>(null);
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

  const selectedPoint =
    selected?.store.lat != null && selected.store.lon != null
      ? { lat: selected.store.lat, lon: selected.store.lon }
      : null;

  const selectedLat = selectedPoint?.lat;
  const selectedLon = selectedPoint?.lon;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedLat == null || selectedLon == null) return;

    // easeTo snaps instantly under prefers-reduced-motion, as long as the
    // animation is not marked essential.
    map.easeTo({
      center: [selectedLon, selectedLat],
      zoom: Math.max(map.getZoom(), 15),
    });
  }, [selectedLat, selectedLon]);

  useEffect(() => {
    if (!userLocation) return;

    mapRef.current?.easeTo({
      center: [userLocation.lon, userLocation.lat],
      zoom: 13,
    });
  }, [userLocation]);

  async function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

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
    return (
      <MapUnavailable message="Karta se trenutačno ne može učitati. Sve trgovine i dalje su na popisu." />
    );
  }

  if (contextLost) {
    return (
      <MapUnavailable
        message="Karta se prekinula."
        action={{
          label: "Učitaj ponovno",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!style.data)
    return <div className="h-full animate-pulse bg-muted" aria-hidden="true" />;

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={style.data}
      hash="map"
      initialViewState={
        initialCenter
          ? {
              latitude: initialCenter.lat,
              longitude: initialCenter.lon,
              zoom: 12,
            }
          : { bounds: CROATIA_BOUNDS }
      }
      style={{ width: "100%", height: "100%" }}
      attributionControl={{
        compact: true,
        customAttribution: MAP_CUSTOM_ATTRIBUTION,
      }}
      interactiveLayerIds={iconsReady ? interactiveLayerIds(chains) : []}
      cursor={cursor}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onLoad={handleLoad}
      onClick={handleClick}
    >
      <NavigationControl position="top-right" />
      <MapPanControls mapRef={mapRef} />

      {iconsReady &&
        [...groups].map(([chain, data]) => (
          <MapChainSource key={chain} chain={chain} data={data} />
        ))}

      <MapOverlays selected={selectedPoint} userLocation={userLocation} />
    </Map>
  );
}
