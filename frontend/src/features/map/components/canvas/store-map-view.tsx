"use client";

import { useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  AttributionControl,
  Map,
  NavigationControl,
  type ErrorEvent as MapErrorEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";

import FavoriteStoreMarkers from "@/features/map/components/canvas/favorite-store-markers";
import MapOverlays, {
  IUserLocation,
} from "@/features/map/components/canvas/map-overlays";
import MapPanControls from "@/features/map/components/canvas/map-pan-controls";
import MapStoreSource, {
  MAP_MAX_ZOOM,
} from "@/features/map/components/canvas/map-store-source";
import SameSpotPopup from "@/features/map/components/canvas/same-spot-popup";
import { ICenterRequest } from "@/hooks/geo/use-geolocation";
import { useMapCamera } from "@/features/map/hooks/use-map-camera";
import { useMapClicks } from "@/features/map/hooks/use-map-clicks";
import { useMapLoad } from "@/features/map/hooks/use-map-load";
import { useViewReport } from "@/features/map/hooks/use-view-report";
import { IListedStore } from "@/features/map/hooks/use-visible-stores";
import { ILatLon } from "@/utils/geo/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/features/map/utils/map-attribution";
import {
  toInitialViewState,
  toSelectedPoint,
} from "@/features/map/utils/map-view";
import { toStoreCollection } from "@/features/map/utils/store-geojson";
import { INTERACTIVE_LAYER_IDS } from "@/features/map/utils/store-layers";
import { IViewArea } from "@/features/map/utils/view-area";
import { storeNamesMap } from "@/constants/name-mappings";

const ALL_CHAINS = Object.keys(storeNamesMap);

export interface IStoreMapViewProps {
  stores: IListedStore[];
  selected: IListedStore | null;
  onSelect: (key: string) => void;
  userLocation: IUserLocation | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
  /** Pixels at the map's bottom under the phone sheet or nav, 0 on desktop. */
  coveredHeight: number;
  onViewChange: (area: IViewArea | null) => void;
  mapStyle: StyleSpecification;
  onContextLost: () => void;
  /** Map errors, including WebGL2 refused after the probe passed. */
  onMapError: (event: MapErrorEvent) => void;
}

export default function StoreMapView({
  stores,
  selected,
  onSelect,
  userLocation,
  centerRequest,
  initialView,
  coveredHeight,
  onViewChange,
  mapStyle,
  onContextLost,
  onMapError,
}: IStoreMapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { mapReady, iconsReady, handleLoad } = useMapLoad({
    mapRef,
    chains: ALL_CHAINS,
    onContextLost,
  });
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
    coveredHeight,
    onViewChange,
  });

  const clicks = useMapClicks({ mapRef, onSelect, coveredBottom });

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
      onError={onMapError}
    >
      <NavigationControl position="bottom-right" />
      <AttributionControl
        position="bottom-left"
        compact
        customAttribution={MAP_CUSTOM_ATTRIBUTION}
      />
      <MapPanControls mapRef={mapRef} />

      {iconsReady && (
        <MapStoreSource
          chains={ALL_CHAINS}
          data={data}
          onStackClick={clicks.handleStack}
        />
      )}

      <MapOverlays
        ready={iconsReady}
        selected={selected}
        selectedPoint={selectedPoint}
        userLocation={userLocation}
      />

      <FavoriteStoreMarkers stores={stores} />

      <SameSpotPopup
        spot={clicks.sameSpot}
        stores={stores}
        onSelect={clicks.selectFromSpot}
        onClose={clicks.closeSpot}
      />
    </Map>
  );
}
