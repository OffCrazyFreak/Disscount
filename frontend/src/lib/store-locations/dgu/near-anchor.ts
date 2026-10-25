type Point = { lat: number; lon: number };

// Farther than this from an independent source, a register address is a
// different building.
const MAX_ANCHOR_M = 150;

/**
 * The register's place for an ambiguous address nearest an independent source
 * (the chain's own point, or a geocoded building), if it is close enough.
 */
export function pickNearAnchor(points: Point[], anchor: Point): Point | null {
  const [nearest] = points
    .map((point) => ({ point, metres: metresApart(point, anchor) }))
    .sort((a, b) => a.metres - b.metres);

  return nearest && nearest.metres <= MAX_ANCHOR_M ? nearest.point : null;
}

function metresApart(a: Point, b: Point): number {
  const north = (a.lat - b.lat) * 111_320;
  const east = (a.lon - b.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180);

  return Math.hypot(north, east);
}
