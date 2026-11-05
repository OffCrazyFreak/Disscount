// A generous box around Croatia, islands included. Upstream data has stores
// with latitude and longitude swapped, which this catches.
const BOUNDS = { minLat: 42.3, maxLat: 46.6, minLon: 13.4, maxLon: 19.5 };

export function isInCroatia(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= BOUNDS.minLat &&
    lat <= BOUNDS.maxLat &&
    lon >= BOUNDS.minLon &&
    lon <= BOUNDS.maxLon
  );
}

/** Returns usable coordinates, repairing a swapped pair, or null. */
export function sanitizeCoordinates(
  lat: number | null | undefined,
  lon: number | null | undefined,
): { lat: number; lon: number } | null {
  if (lat == null || lon == null) return null;
  if (isInCroatia(lat, lon)) return { lat, lon };
  if (isInCroatia(lon, lat)) return { lat: lon, lon: lat };

  return null;
}
