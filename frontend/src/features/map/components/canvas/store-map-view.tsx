"use client";

import { ReactNode, useRef, useState } from "react";
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
import { ICenterRequest } from "@/hooks/use-geolocation";
import { useMapCamera } from "@/features/map/hooks/canvas/use-map-camera";
import { useMapClicks } from "@/features/map/hooks/canvas/use-map-clicks";
import { useMapLoad } from "@/features/map/hooks/canvas/use-map-load";
import { useViewReport } from "@/features/map/hooks/canvas/use-view-report";
import { IListedStore } from "@/features/map/hooks/use-visible-stores";
import { ILatLon } from "@/utils/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/features/map/utils/canvas/map-attribution";
import {
  toInitialViewState,
  toSelectedPoint,
} from "@/features/map/utils/view/map-view";
import { toStoreCollection } from "@/features/map/utils/canvas/store-geojson";
import { INTERACTIVE_LAYER_IDS } from "@/features/map/utils/canvas/store-layers";
import { IMapCover, IViewArea } from "@/features/map/utils/view/view-area";
import { storeNamesMap } from "@/constants/name-mappings";

const ALL_CHAINS = Object.keys(storeNamesMap);

export interface IStoreMapViewProps {
  stores: IListedStore[];
  selected: IListedStore | null;
  onSelect: (key: string) => void;
  userLocation: IUserLocation | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
  /** What the phone sheet or nav, or the desktop search panel, hides of the map. */
  cover: IMapCover;
  onViewChange: (area: IViewArea | null) => void;
  mapStyle: StyleSpecification;
  onContextLost: () => void;
  /** Map errors, including WebGL2 refused after the probe passed. */
  onMapError: (event: MapErrorEvent) => void;
  /** Overlays that need the map, such as a popover anchored to a pin. */
  children?: ReactNode;
}

export default function StoreMapView({
  stores,
  selected,
  onSelect,
  userLocation,
  centerRequest,
  initialView,
  cover,
  onViewChange,
  mapStyle,
  onContextLost,
  onMapError,
  ...mapContent
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
    selected,
    cover,
    centerRequest,
    initialView,
  });

  const { visibleCover, reportView } = useViewReport({
    mapRef,
    mapReady,
    cover,
    onViewChange,
  });

  const clicks = useMapClicks({ mapRef, onSelect, cover: visibleCover });

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

      {mapContent.children}
    </Map>
  );
}
