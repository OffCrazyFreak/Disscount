"use client";

import { Layer, Source, useMap } from "react-map-gl/maplibre";

import {
  SELECTED_FRAME_ID,
  SELECTED_STACK_FRAME_ID,
} from "@/app/[locale]/map/utils/chain-icon";
import { useSelectedFrame } from "@/app/[locale]/map/hooks/use-selected-frame";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { ILatLon } from "@/app/[locale]/map/utils/distance";

interface IMapOverlaysProps {
  /** True once the store layers exist, so the frame can find its stack. */
  ready: boolean;
  selected: IListedStore | null;
  selectedPoint: ILatLon | null;
  userLocation: ILatLon | null;
}

function point({ lat, lon }: ILatLon) {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [lon, lat] },
    properties: {},
  };
}

/** A frame around the selected store and a dot for the user's position. */
export default function MapOverlays({
  ready,
  selected,
  selectedPoint,
  userLocation,
}: IMapOverlaysProps) {
  const { current: map } = useMap();
  const frame = useSelectedFrame({
    map,
    ready,
    selectedKey: selected?.key ?? null,
    selectedPoint,
  });

  return (
    <>
      {userLocation && (
        <Source id="user-location" type="geojson" data={point(userLocation)}>
          <Layer
            id="user-location-dot"
            type="circle"
            paint={{
              "circle-radius": 8,
              "circle-color": "#2563eb",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>
      )}

      {frame && (
        <Source id="selected-store" type="geojson" data={point(frame)}>
          <Layer
            id="selected-store-frame"
            type="symbol"
            layout={{
              "icon-image": frame.wide
                ? SELECTED_STACK_FRAME_ID
                : SELECTED_FRAME_ID,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            }}
          />
        </Source>
      )}
    </>
  );
}
