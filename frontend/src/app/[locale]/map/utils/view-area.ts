import type { Map as MapLibreMap } from "maplibre-gl";

import { IListedStore } from "@/app/[locale]/map/hooks/use-visible-stores";

/** The visible map as four [lon, lat] corners, in order around the edge. */
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

/** The part of the map not hidden under the phone sheet, or null if none is. */
export function readVisibleArea(
  map: MapLibreMap,
  coveredBottom: number,
): IViewArea | null {
  const { clientWidth: width, clientHeight } = map.getCanvas();
  const height = clientHeight - coveredBottom;
  if (width <= 0 || height <= 0) return null;

  // All four corners, not a north-aligned box around them: on a rotated
  // map that box reaches past the screen and would count hidden stores.
  const corners = [
    map.unproject([0, 0]),
    map.unproject([width, 0]),
    map.unproject([width, height]),
    map.unproject([0, height]),
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

/** Stores on the visible map, then the rest, each keeping the list's order. */
export function splitByView(rows: IListedStore[], view: IViewArea | null) {
  if (!view) return { onMap: [], elsewhere: rows };

  const onMap: IListedStore[] = [];
  const elsewhere: IListedStore[] = [];

  for (const row of rows) {
    (isInView(row, view) ? onMap : elsewhere).push(row);
  }

  return { onMap, elsewhere };
}
