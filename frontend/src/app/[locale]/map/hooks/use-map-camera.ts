"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/maplibre";

import { ICenterRequest } from "@/app/[locale]/map/hooks/use-geolocation";
import { circleBounds } from "@/app/[locale]/map/utils/circle";
import { ILatLon } from "@/app/[locale]/map/utils/distance";

interface IUseMapCameraOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  selectedPoint: ILatLon | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
}

/** Moves the map to the selected store, a GPS fix or the pinned place. */
export function useMapCamera({
  mapRef,
  mapReady,
  selectedPoint,
  centerRequest,
  initialView,
}: IUseMapCameraOptions) {
  // Set by a drag, wheel or key, never by our own easeTo calls.
  const userMoved = useRef(false);
  const gpsCentered = useRef(false);
  // A shared #map= link names its own view, which only an explicit tap replaces.
  const [openedWithView] = useState(() =>
    window.location.hash.startsWith("#map="),
  );

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
  }, [mapRef, mapReady, selectedLat, selectedLon]);

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
    const map = mapRef.current;
    if (!map) return;

    if (centerRequest.radius) {
      // The guess area fills about 60% of the width, edge to edge.
      map.fitBounds(circleBounds(centerRequest, centerRequest.radius), {
        padding: Math.round(map.getContainer().clientWidth * 0.2),
      });
      return;
    }

    map.easeTo({ center: [centerRequest.lon, centerRequest.lat], zoom: 13 });
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

  return { handleMoveStart };
}
