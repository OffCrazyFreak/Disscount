import type { LngLatBoundsLike } from "maplibre-gl";

export interface IClusterLeaf {
  key: string;
  lon: number;
  lat: number;
}

// About 20 m: geocoded addresses in one mall land this close or on the very
// same point, and no zoom level separates them on screen.
const SAME_SPOT_DEGREES = 0.0002;

/** True when the stores share one spot, so a list beats zooming in. */
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

/**
 * Room around a stack's stores when zooming to them, kept clear of the phone
 * sheet. MapLibre refuses to move when the padding outgrows the canvas, as it
 * can on a phone in landscape, so the margin shrinks to fit.
 */
export function fitPadding(
  width: number,
  height: number,
  coveredBottom: number,
) {
  const margin = Math.min(64, width / 4, (height - coveredBottom) / 4);

  return {
    top: margin,
    right: margin,
    bottom: coveredBottom + margin,
    left: margin,
  };
}
