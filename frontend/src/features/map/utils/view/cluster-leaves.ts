import type { LngLatBoundsLike } from "maplibre-gl";
import type { IMapCover } from "@/features/map/utils/view/view-area";

export interface IClusterLeaf {
  key: string;
  lon: number;
  lat: number;
}

// About 20 m: addresses in one mall land this close, and no zoom level separates them.
const SAME_SPOT_DEGREES = 0.0002;

export function isSameSpot(leaves: IClusterLeaf[]): boolean {
  const lons = leaves.map((leaf) => leaf.lon);
  const lats = leaves.map((leaf) => leaf.lat);

  return (
    Math.max(...lons) - Math.min(...lons) < SAME_SPOT_DEGREES &&
    Math.max(...lats) - Math.min(...lats) < SAME_SPOT_DEGREES
  );
}

export function leafBounds(leaves: IClusterLeaf[]): LngLatBoundsLike {
  const lons = leaves.map((leaf) => leaf.lon);
  const lats = leaves.map((leaf) => leaf.lat);

  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

/** MapLibre refuses to move when padding outgrows the canvas, so the margin shrinks to fit. */
export function fitPadding(width: number, height: number, cover: IMapCover) {
  const margin = Math.min(
    64,
    (width - cover.right) / 4,
    (height - cover.top - cover.bottom) / 4,
  );

  return {
    top: cover.top + margin,
    right: cover.right + margin,
    bottom: cover.bottom + margin,
    left: margin,
  };
}
