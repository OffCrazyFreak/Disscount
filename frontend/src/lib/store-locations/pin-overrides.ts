import { storeKey } from "@/lib/store-locations/upstream-stores";

/**
 * Stores whose automatic pin is verified wrong, pinned by hand in code. Only
 * OpenStreetMap points (ODbL, credited on the map) or places a person has
 * confirmed belong here, never coordinates copied from Google Maps. Delete an
 * entry when the store moves.
 */
export const PIN_OVERRIDES = new Map<string, { lat: number; lon: number }>([
  // Stanić Biograd: diskont.hr's point is 194 m off, on empty ground. OSM
  // node 2432262893 (shop "Stanić"), 12 m from the store, checked 2026-10-24.
  [storeKey("stanic", "935"), { lat: 43.942276, lon: 15.4545024 }],
]);
