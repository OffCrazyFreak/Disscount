import type { Map as MapLibreMap } from "maplibre-gl";

import { IListedStore } from "@/app/[locale]/map/hooks/state/use-visible-stores";

export interface IViewArea {
  corners: [number, number][];
}

export function sameView(a: IViewArea | null, b: IViewArea | null) {
  if (!a || !b) return a === b;

  return a.corners.every(
    ([lon, lat], index) =>
      lon === b.corners[index][0] && lat === b.corners[index][1],
  );
}

/** Map pixels hidden by the header on top, the phone sheet or nav at the bottom, the desktop panel at the right. */
export interface IMapCover {
  top: number;
  bottom: number;
  right: number;
}

export const NO_COVER: IMapCover = { top: 0, bottom: 0, right: 0 };

/** The part of the map nothing covers, or null if none is left. */
export function readVisibleArea(
  map: MapLibreMap,
  cover: IMapCover,
): IViewArea | null {
  const { clientWidth, clientHeight } = map.getCanvas();
  const width = clientWidth - cover.right;
  const top = cover.top;
  const bottom = clientHeight - cover.bottom;
  if (width <= 0 || bottom - top <= 0) return null;

  // All four corners, because a north-aligned box on a rotated map counts hidden stores.
  const corners = [
    map.unproject([0, top]),
    map.unproject([width, top]),
    map.unproject([width, bottom]),
    map.unproject([0, bottom]),
  ];

  return { corners: corners.map(({ lng, lat }) => [lng, lat]) };
}

// Inside a convex shape means on the same side of every edge.
function isInView({ store }: IListedStore, { corners }: IViewArea) {
  if (store.lat == null || store.lon == null) return false;

  let side = 0;

  for (const [index, [lon1, lat1]] of corners.entries()) {
    const [lon2, lat2] = corners[(index + 1) % corners.length];
    const cross =
      (lon2 - lon1) * (store.lat - lat1) - (lat2 - lat1) * (store.lon - lon1);
    if (cross === 0) continue;

    if (side === 0) side = Math.sign(cross);
    else if (Math.sign(cross) !== side) return false;
  }

  return true;
}

export function splitByView(rows: IListedStore[], view: IViewArea | null) {
  if (!view) return { onMap: [], elsewhere: rows };

  const onMap: IListedStore[] = [];
  const elsewhere: IListedStore[] = [];

  for (const row of rows) {
    (isInView(row, view) ? onMap : elsewhere).push(row);
  }

  return { onMap, elsewhere };
}
