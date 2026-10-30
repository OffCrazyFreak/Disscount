"use client";

import { Layer, Source, useMap } from "react-map-gl/maplibre";

import {
  SELECTED_FRAME_ID,
  SELECTED_STACK_FRAME_ID,
} from "@/app/[locale]/map/utils/chain-icon";
import { useSelectedFrame } from "@/app/[locale]/map/hooks/use-selected-frame";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { GUESS_RADIUS_M } from "@/app/[locale]/map/hooks/use-geolocation";
import { circlePolygon } from "@/app/[locale]/map/utils/circle";
import { ILatLon } from "@/app/[locale]/map/utils/distance";

export interface IUserLocation extends ILatLon {
  /** The IP guess, drawn as an area with no centre so it claims no street. */
  approximate?: boolean;
}

interface IMapOverlaysProps {
  /** True once the store layers exist, so the frame can find its stack. */
  ready: boolean;
  selected: IListedStore | null;
  selectedPoint: ILatLon | null;
  userLocation: IUserLocation | null;
}

function point({ lat, lon }: ILatLon) {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [lon, lat] },
    properties: {},
  };
}

/** A frame around the selected store and the user's dot or guessed area. */
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
      {userLocation?.approximate && (
        <Source
          id="approximate-area"
          type="geojson"
          data={circlePolygon(userLocation, GUESS_RADIUS_M)}
        >
          <Layer
            id="approximate-area-fill"
            type="fill"
            paint={{ "fill-color": "#2563eb", "fill-opacity": 0.1 }}
          />
          <Layer
            id="approximate-area-edge"
            type="line"
            paint={{
              "line-color": "#2563eb",
              "line-opacity": 0.7,
              "line-width": 1.5,
              "line-dasharray": [3, 2],
            }}
          />
        </Source>
      )}

      {userLocation && !userLocation.approximate && (
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
