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

import FavoriteStoreMarkers from "@/app/[locale]/map/components/favorite-store-markers";
import MapOverlays, {
  IUserLocation,
} from "@/app/[locale]/map/components/map-overlays";
import MapPanControls from "@/app/[locale]/map/components/map-pan-controls";
import MapStoreSource, {
  MAP_MAX_ZOOM,
} from "@/app/[locale]/map/components/map-store-source";
import SameSpotPopup from "@/app/[locale]/map/components/same-spot-popup";
import { ICenterRequest } from "@/app/[locale]/map/hooks/use-geolocation";
import { useMapCamera } from "@/app/[locale]/map/hooks/use-map-camera";
import { useMapClicks } from "@/app/[locale]/map/hooks/use-map-clicks";
import { useMapLoad } from "@/app/[locale]/map/hooks/use-map-load";
import { useViewReport } from "@/app/[locale]/map/hooks/use-view-report";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { ILatLon } from "@/app/[locale]/map/utils/distance";
import { MAP_CUSTOM_ATTRIBUTION } from "@/app/[locale]/map/utils/map-attribution";
import {
  toInitialViewState,
  toSelectedPoint,
} from "@/app/[locale]/map/utils/map-view";
import { toStoreCollection } from "@/app/[locale]/map/utils/store-geojson";
import { INTERACTIVE_LAYER_IDS } from "@/app/[locale]/map/utils/store-layers";
import { IViewArea } from "@/app/[locale]/map/utils/view-area";
import { storeNamesMap } from "@/constants/name-mappings";

const ALL_CHAINS = Object.keys(storeNamesMap);

export interface IStoreMapViewProps {
  stores: IListedStore[];
  selected: IListedStore | null;
  onSelect: (key: string) => void;
  userLocation: IUserLocation | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
  /** Share of the map's height under the phone sheet, 0 on desktop. */
  coveredShare: number;
  onViewChange: (area: IViewArea | null) => void;
  mapStyle: StyleSpecification;
  onContextLost: () => void;
  /** Map errors, including WebGL2 refused after the probe passed. */
  onMapError: (event: MapErrorEvent) => void;
}

/** The live map: store stacks, the selection frame and the user's position. */
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
    coveredShare,
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
