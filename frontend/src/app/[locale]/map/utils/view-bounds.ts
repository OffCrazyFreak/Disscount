import type { Map as MapLibreMap } from "maplibre-gl";

import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

export interface IViewBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function sameBounds(a: IViewBounds | null, b: IViewBounds | null) {
  if (!a || !b) return a === b;

  return (
    a.west === b.west &&
    a.south === b.south &&
    a.east === b.east &&
    a.north === b.north
  );
}

/** The part of the map not hidden under the phone sheet, or null if none is. */
export function readVisibleBounds(
  map: MapLibreMap,
  coveredBottom: number,
): IViewBounds | null {
  const { clientWidth: width, clientHeight } = map.getCanvas();
  const height = clientHeight - coveredBottom;
  if (width <= 0 || height <= 0) return null;

  // All four corners, since a rotated map's view is not north-aligned.
  const corners = [
    map.unproject([0, 0]),
    map.unproject([width, 0]),
    map.unproject([0, height]),
    map.unproject([width, height]),
  ];
  const lons = corners.map((corner) => corner.lng);
  const lats = corners.map((corner) => corner.lat);

  return {
    west: Math.min(...lons),
    south: Math.min(...lats),
    east: Math.max(...lons),
    north: Math.max(...lats),
  };
}

function isInView({ store }: IListedStore, bounds: IViewBounds) {
  if (store.lat == null || store.lon == null) return false;

  return (
    store.lat >= bounds.south &&
    store.lat <= bounds.north &&
    store.lon >= bounds.west &&
    store.lon <= bounds.east
  );
}

/** Stores on the visible map, then the rest, each keeping the list's order. */
export function splitByView(rows: IListedStore[], bounds: IViewBounds | null) {
  if (!bounds) return { onMap: [], elsewhere: rows };

  const onMap: IListedStore[] = [];
  const elsewhere: IListedStore[] = [];

  for (const row of rows) {
    (isInView(row, bounds) ? onMap : elsewhere).push(row);
  }

  return { onMap, elsewhere };
}
