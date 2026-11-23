"use client";

import { RefObject, useEffect, useRef } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { Map as MapLibreMap } from "maplibre-gl";

import {
  IBox,
  PIN_HALF_SIZE,
  cameraPanToFit,
  visibleBox,
} from "@/app/[locale]/map/utils/geometry/fit-in-view";
import { IListedStore } from "@/app/[locale]/map/hooks/state/use-visible-stores";
import { toSelectedPoint } from "@/app/[locale]/map/utils/geometry/map-view";
import { IMapCover } from "@/app/[locale]/map/utils/geometry/view-area";
import { ILatLon } from "@/utils/distance";

// The phone has no card to wait for, and the desktop popup shows within a frame or two of the camera stopping.
const CARD_WAIT_MS = 300;
const GIVE_UP_MS = 3000;

interface IUseKeepSelectionInViewOptions {
  mapRef: RefObject<MapRef | null>;
  mapReady: boolean;
  selected: IListedStore | null;
  /** What the header, sheet, nav or panel hides of the map. */
  cover: IMapCover;
}

function relativeBox(element: Element, container: HTMLElement): IBox {
  const box = element.getBoundingClientRect();
  const origin = container.getBoundingClientRect();

  return {
    left: box.left - origin.left,
    top: box.top - origin.top,
    right: box.right - origin.left,
    bottom: box.bottom - origin.top,
  };
}

function panToFit(map: MapLibreMap, point: ILatLon, cover: IMapCover) {
  const container = map.getContainer();
  const { x, y } = map.project([point.lon, point.lat]);
  const pin = {
    left: x - PIN_HALF_SIZE,
    top: y - PIN_HALF_SIZE,
    right: x + PIN_HALF_SIZE,
    bottom: y + PIN_HALF_SIZE,
  };
  const popup = container.querySelector(".maplibregl-popup");
  const card = popup ? relativeBox(popup, container) : null;
  const area = visibleBox(container.clientWidth, container.clientHeight, cover);

  const pan = cameraPanToFit(pin, card, area);
  // panBy eases, and MapLibre makes that instant under prefers-reduced-motion.
  if (pan.x || pan.y) map.panBy([pan.x, pan.y]);
}

/** After a pick, and when a cover, the card or the window resizes, pans so the pin and card are in sight. */
export function useKeepSelectionInView({
  mapRef,
  mapReady,
  selected,
  cover,
}: IUseKeepSelectionInViewOptions) {
  const selectionKey = selected?.key;
  const selectedPoint = toSelectedPoint(selected);
  const lat = selectedPoint?.lat;
  const lon = selectedPoint?.lon;
  const { top, bottom, right } = cover;

  // Once the user moves the map after a pick, they chose where to look, until the next pick.
  const userMovedSincePick = useRef(false);

  useEffect(() => {
    userMovedSincePick.current = false;
  }, [selectionKey]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map) return;

    function markUserMove(event: { originalEvent?: Event }) {
      if (event.originalEvent) userMovedSincePick.current = true;
    }

    map.on("movestart", markUserMove);

    return () => {
      map.off("movestart", markUserMove);
    };
  }, [mapRef, mapReady]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map || !selectionKey || lat == null || lon == null) {
      return;
    }

    const point = { lat, lon };
    const currentCover = { top, bottom, right };
    let armedAt = 0;
    let frame = 0;
    let cardObserver: ResizeObserver | null = null;

    function watchCard(popup: Element | null) {
      if (!popup || cardObserver) return;

      // The hours badge and details load after the card first shows, and change its height.
      cardObserver = new ResizeObserver(fitSoon);
      cardObserver.observe(popup);
    }

    function attempt() {
      if (!map || userMovedSincePick.current) return;

      const waited = performance.now() - armedAt;
      const popup = map.getContainer().querySelector(".maplibregl-popup");
      watchCard(popup);

      const isSettled = !map.isMoving() && (popup || waited > CARD_WAIT_MS);
      if (isSettled) panToFit(map, point, currentCover);
      else if (waited < GIVE_UP_MS) frame = requestAnimationFrame(attempt);
    }

    function fitSoon() {
      if (userMovedSincePick.current) return;

      cancelAnimationFrame(frame);
      armedAt = performance.now();
      frame = requestAnimationFrame(attempt);
    }

    window.addEventListener("resize", fitSoon);
    fitSoon();

    return () => {
      cancelAnimationFrame(frame);
      cardObserver?.disconnect();
      window.removeEventListener("resize", fitSoon);
    };
  }, [mapRef, mapReady, selectionKey, lat, lon, top, bottom, right]);
}
