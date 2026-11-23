"use client";

import { RefObject, useEffect } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { Map as MapLibreMap } from "maplibre-gl";

import {
  IBox,
  cameraPanToFit,
  visibleBox,
} from "@/app/[locale]/map/utils/fit-in-view";
import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";
import { toSelectedPoint } from "@/app/[locale]/map/utils/map-view";
import { IMapCover } from "@/app/[locale]/map/utils/view-area";
import { ILatLon } from "@/utils/distance";

// Half a logo tile with its count badge, so the whole pin stays in sight.
const PIN_HALF_SIZE = 24;
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

/** After a pick, or when the header, sheet or panel changes size, pans once so the pin and its card are in sight. */
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

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!mapReady || !map || !selectionKey || lat == null || lon == null) {
      return;
    }

    const point = { lat, lon };
    const currentCover = { top, bottom, right };
    const armedAt = performance.now();
    let frame = 0;

    function stop() {
      cancelAnimationFrame(frame);
      map?.off("movestart", stopOnUserMove);
    }

    // A drag or zoom by the user means they chose where to look.
    function stopOnUserMove(event: { originalEvent?: Event }) {
      if (event.originalEvent) stop();
    }

    function attempt() {
      if (!map) return;

      const waited = performance.now() - armedAt;
      const hasCard = map.getContainer().querySelector(".maplibregl-popup");
      const isSettled = !map.isMoving() && (hasCard || waited > CARD_WAIT_MS);

      if (isSettled) {
        stop();
        panToFit(map, point, currentCover);
      } else if (waited < GIVE_UP_MS) {
        frame = requestAnimationFrame(attempt);
      } else {
        stop();
      }
    }

    map.on("movestart", stopOnUserMove);
    frame = requestAnimationFrame(attempt);

    return stop;
  }, [mapRef, mapReady, selectionKey, lat, lon, top, bottom, right]);
}
