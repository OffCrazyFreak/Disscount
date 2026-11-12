"use client";

import { RefObject, useEffect, useEffectEvent, useRef, useState } from "react";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/maplibre";

import { ICenterRequest } from "@/hooks/use-geolocation";
import { circleBounds } from "@/app/[locale]/map/utils/circle";
import { ILatLon } from "@/utils/distance";

interface IUseMapCameraOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  selectedPoint: ILatLon | null;
  centerRequest: ICenterRequest | null;
  initialView: (ILatLon & { zoom: number }) | null;
}

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

    // easeTo snaps instantly under prefers-reduced-motion, as long as the animation is not marked essential.
    map.easeTo({
      center: [selectedLon, selectedLat],
      zoom: Math.max(map.getZoom(), 15),
    });
  }, [mapRef, mapReady, selectedLat, selectedLon]);

  const hasSelection = selectedLat != null;

  const centerOn = useEffectEvent((request: ICenterRequest) => {
    // An untapped fix must not move the map from where the user or a shared link put it.
    if (request.auto && (userMoved.current || hasSelection || openedWithView)) {
      return;
    }

    gpsCentered.current = true;
    const map = mapRef.current;
    if (!map) return;

    if (request.radius) {
      // The guess area fills about 60% of the narrower side, so a landscape phone's padding never outgrows its height.
      const { clientWidth, clientHeight } = map.getContainer();
      map.fitBounds(circleBounds(request, request.radius), {
        padding: Math.round(Math.min(clientWidth, clientHeight) * 0.2),
      });
      return;
    }

    map.easeTo({ center: [request.lon, request.lat], zoom: 13 });
  });

  useEffect(() => {
    if (mapReady && centerRequest) centerOn(centerRequest);
  }, [mapReady, centerRequest]);

  const jumpToInitialView = useEffectEvent(() => {
    if (!initialView) return;
    if (userMoved.current || gpsCentered.current) return;
    if (hasSelection || openedWithView) return;

    mapRef.current?.jumpTo({
      center: [initialView.lon, initialView.lat],
      zoom: initialView.zoom,
    });
  });

  // The pinned place's data can arrive after the map opened on the IP guess or all of Croatia.
  useEffect(() => {
    if (mapReady) jumpToInitialView();
  }, [mapReady, initialView?.lat, initialView?.lon, initialView?.zoom]);

  function handleMoveStart(event: ViewStateChangeEvent) {
    if (event.originalEvent) userMoved.current = true;
  }

  return { handleMoveStart };
}
