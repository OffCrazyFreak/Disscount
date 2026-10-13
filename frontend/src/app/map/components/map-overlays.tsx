"use client";

import { Layer, Source } from "react-map-gl/maplibre";

import { ILatLon } from "@/app/map/utils/distance";

interface IMapOverlaysProps {
  selected: ILatLon | null;
  userLocation: ILatLon | null;
}

function point({ lat, lon }: ILatLon) {
  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [lon, lat] },
    properties: {},
  };
}

/** A ring around the selected store and a dot for the user's position. */
export default function MapOverlays({
  selected,
  userLocation,
}: IMapOverlaysProps) {
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

      {selected && (
        <Source id="selected-store" type="geojson" data={point(selected)}>
          <Layer
            id="selected-store-ring"
            type="circle"
            paint={{
              "circle-radius": 26,
              "circle-color": "rgba(0,0,0,0)",
              "circle-stroke-width": 4,
              "circle-stroke-color": "#16a34a",
            }}
          />
        </Source>
      )}
    </>
  );
}
