import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import { ILatLon } from "@/app/[locale]/map/utils/distance";
import {
  TOP_STACK_LAYER_ID,
  POINT_LAYER_ID,
  STORE_SOURCE_ID,
} from "@/app/[locale]/map/utils/store-layers";

export interface ISelectedFrame extends ILatLon {
  /** Framing a stack of several chains, which is wider than one tile. */
  wide: boolean;
}

function chainCount(properties: Record<string, unknown>): number {
  return Object.entries(properties).filter(
    ([name, value]) => name.startsWith("count:") && Number(value) > 0,
  ).length;
}

/**
 * Where the selected store shows right now: its own tile, or the stack it
 * merged into once the map zoomed out. Null while neither is on screen, so
 * the frame never circles empty map.
 */
export async function findSelectedFrame(
  map: MapLibreMap,
  key: string,
  point: ILatLon,
): Promise<ISelectedFrame | null> {
  const singles = map.queryRenderedFeatures({ layers: [POINT_LAYER_ID] });
  if (singles.some((feature) => feature.properties.key === key)) {
    return { ...point, wide: false };
  }

  const source = map.getSource<GeoJSONSource>(STORE_SOURCE_ID);
  if (!source) return null;

  // A stack can be reported once per tile it spans, so keep one each.
  const stacks = [
    ...new Map(
      map
        .queryRenderedFeatures({ layers: [TOP_STACK_LAYER_ID] })
        .filter((stack) => stack.geometry.type === "Point")
        .map((stack) => [Number(stack.properties.cluster_id), stack]),
    ),
  ];

  const holds = await Promise.all(
    stacks.map(async ([id]) =>
      (await source.getClusterLeaves(id, Infinity, 0)).some(
        (leaf) => leaf.properties?.key === key,
      ),
    ),
  );

  const found = stacks.find((_, index) => holds[index])?.[1];
  if (!found || found.geometry.type !== "Point") return null;

  const [lon, lat] = found.geometry.coordinates;
  return { lat, lon, wide: chainCount(found.properties) > 1 };
}

export function sameFrame(a: ISelectedFrame | null, b: ISelectedFrame | null) {
  return a?.lat === b?.lat && a?.lon === b?.lon && a?.wide === b?.wide;
}
