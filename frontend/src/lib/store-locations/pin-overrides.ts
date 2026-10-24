import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { storeKey } from "@/lib/store-locations/upstream-stores";

/**
 * Stores whose automatic pin is verified wrong, pinned by hand in code. Only
 * OpenStreetMap points (ODbL, credited on the map) or places a person has
 * confirmed belong here, never coordinates copied from Google Maps. When the
 * store moves, replace the entry: deleting it brings back the source's own
 * point, which was wrong.
 */
export const PIN_OVERRIDES = new Map<string, { lat: number; lon: number }>([
  // Stanić Biograd: diskont.hr's point is 194 m off, on empty ground. OSM
  // node 2432262893 (shop "Stanić"), 12 m from the store, checked 2026-10-24.
  [storeKey("stanic", "935"), { lat: 43.942276, lon: 15.4545024 }],
  // Gavranović Duga Resa: Geoapify 132 m off; OSM node 2175649707 "market Gavranović".
  [storeKey("gavranovic", "332"), { lat: 45.4477819, lon: 15.5015569 }],
  // NTL Jelisavac 37: ntl.hr shares one point for two stores; OSM node 4758389171 "NTL".
  [storeKey("ntl", "20552"), { lat: 45.5300831, lon: 18.1579383 }],
  // NTL Koška: ntl.hr's point is 273 m off; centre of OSM way 1474840158 (NTL, N. Š. Zrinskog 3).
  [storeKey("ntl", "20324"), { lat: 45.5452705, lon: 18.2868595 }],
  // NTL Arslanovci: ntl.hr's point is 54 m off; OSM node 9001375947 (NTL, Njemačka ulica 1).
  [storeKey("ntl", "20345"), { lat: 45.3336712, lon: 17.6834783 }],
]);

/** The override's point, when it passes the same checks as every source. */
export function usableOverride(
  overrides: Map<string, { lat: number; lon: number }>,
  key: string,
): { lat: number; lon: number } | null {
  const override = overrides.get(key);

  return override ? sanitizeCoordinates(override.lat, override.lon) : null;
}
