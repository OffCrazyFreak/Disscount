"use client";

import { useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  AttributionControl,
  Map,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";

import MapOverlays from "@/app/[locale]/map/components/map-overlays";
import MapPanControls from "@/app/[locale]/map/components/map-pan-controls";
import MapStoreSource, {
  MAP_MAX_ZOOM,
} from "@/app/[locale]/map/components/map-store-source";
import SameSpotPopup from "@/app/[locale]/map/components/same-spot-popup";
import { ICenterRequest } from "@/app/[locale]/map/hooks/use-geolocation";
import { useMapCamera } from "@/app/[locale]/map/hooks/use-map-camera";
import { useMapClicks } from "@/app/[locale]/map/hooks/use-map-clicks";
import { useViewReport } from "@/app/[locale]/map/hooks/use-view-report";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { ILatLon } from "@/app/[locale]/map/utils/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/app/[locale]/map/utils/map-attribution";
import {
  toInitialViewState,
  toSelectedPoint,
} from "@/app/[locale]/map/utils/map-view";
import { registerChainIcons } from "@/app/[locale]/map/utils/register-chain-icons";
import { toStoreCollection } from "@/app/[locale]/map/utils/store-geojson";
import { INTERACTIVE_LAYER_IDS } from "@/app/[locale]/map/utils/store-layers";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";
import { storeNamesMap } from "@/constants/name-mappings";

const ALL_CHAINS = Object.keys(storeNamesMap);

export interface IStoreMapViewProps {
  stores: IListedStore[];
  selected: IListedStore | null;
  onSelect: (key: string) => void;
  userLocation: ILatLon | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
  /** Share of the map's height under the phone sheet, 0 on desktop. */
  coveredShare: number;
  onViewChange: (area: IViewArea | null) => void;
  mapStyle: StyleSpecification;
  onContextLost: () => void;
}

/** The live map: store stacks, the selection ring and the user's position. */
export default function StoreMapView({
  stores,
  selected,
  onSelect,
  userLocation,
  centerRequest,
  initialView,
  coveredShare,
  onViewChange,
  mapStyle,
  onContextLost,
}: IStoreMapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [cursor, setCursor] = useState<string>("");

  const data = toStoreCollection(stores.map((row) => row.store));

  const selectedPoint = toSelectedPoint(selected);

  const { handleMoveStart } = useMapCamera({
    mapRef,
    mapReady,
    selectedPoint,
    centerRequest,
    initialView,
  });

  const { coveredBottom, reportView } = useViewReport({
    mapRef,
    mapReady,
    coveredShare,
    onViewChange,
  });

  const clicks = useMapClicks({ mapRef, onSelect, coveredBottom });

  async function handleLoad() {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // A store picked before the map loaded (a shared link) still gets centred.
    setMapReady(true);

    // Known MapLibre bug (#8690): a context lost early leaves a blank map, so
    // offer a reload rather than a grey rectangle.
    map.getCanvas().addEventListener("webglcontextlost", onContextLost);

    await registerChainIcons(map, ALL_CHAINS);
    setIconsReady(true);
  }

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      mapStyle={mapStyle}
      hash="map"
      maxZoom={MAP_MAX_ZOOM}
      initialViewState={toInitialViewState(initialView)}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      interactiveLayerIds={iconsReady ? INTERACTIVE_LAYER_IDS : []}
      cursor={cursor}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("")}
      onLoad={handleLoad}
      onMoveStart={handleMoveStart}
      onMoveEnd={reportView}
      onClick={clicks.handleClick}
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

      {iconsReady && <MapStoreSource chains={ALL_CHAINS} data={data} />}

      <MapOverlays selected={selectedPoint} userLocation={userLocation} />

      <SameSpotPopup
        spot={clicks.sameSpot}
        stores={stores}
        onSelect={clicks.selectFromSpot}
        onClose={clicks.closeSpot}
      />
    </Map>
  );
}
