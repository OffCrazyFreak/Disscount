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
  // Gavranović Hrvatska Kostajnica: the register has G. Lederera 27 in far-apart places; OSM node 12724057283 "Gavranović".
  [storeKey("gavranovic", "311"), { lat: 45.2289262, lon: 16.5361268 }],
  // Gavranović Netretić: the register has Netretić 4 in far-apart places; OSM node 9676940071 "Gavranović Maret".
  [storeKey("gavranovic", "519"), { lat: 45.5079844, lon: 15.4146165 }],
  // Gavranović Krnjak: the register's point is a bakery 69 m east; OSM node 1434059889 "Market Gavranović".
  [storeKey("gavranovic", "402"), { lat: 45.3377235, lon: 15.6089138 }],
  // Gavranović Gažanski trg, Karlovac: centre of OSM way 83376926 "Gavranović", which Google agrees with.
  // Its fixme asks whether the shop is at 14 or at 8 as upstream says.
  [storeKey("gavranovic", "457"), { lat: 45.4966094, lon: 15.5575964 }],
  // NTL Bužanova 36, Zagreb: ntl.hr's point is 157 m off; OSM node 5576855520 "NTL".
  [storeKey("ntl", "10108"), { lat: 45.8122334, lon: 16.00583 }],
  // NTL Dunav, Dalj: ntl.hr's point is 2.2 km off; centre of OSM way 295744308 (NTL, B. J. Jelačića 19).
  [storeKey("ntl", "20212"), { lat: 45.4862915, lon: 18.9832299 }],
  // NTL Horvatova 38, Slavonski Brod: a unit in the city market; centre of OSM way 69231960 "Gradska tržnica".
  [storeKey("ntl", "20350"), { lat: 45.1543054, lon: 18.0224794 }],
  // NTL Požega: ntl.hr's point is 320 m off; OSM entrance node 9992673674 (Ulica Vanje Radauša 10).
  [storeKey("ntl", "20374"), { lat: 45.331753, lon: 17.6631576 }],
  // NTL Vesna, Dopsin: ntl.hr's point is in Koritna; OSM node 534798152 "NTL".
  [storeKey("ntl", "20538"), { lat: 45.4514638, lon: 18.5591966 }],
  // NTL Sesvete Ludbreške: centre of OSM way 1112299597, still named Kitro, whose stores NTL took over in 2024.
  [storeKey("ntl", "33061"), { lat: 46.286143, lon: 16.6490272 }],
  // Tommy Jezera: centre of OSM way 837951774 (Tommy, Donji Put 2A). Upstream's code has a leading space.
  [storeKey("tommy", " 10316"), { lat: 43.7895493, lon: 15.6304195 }],
]);

/** The override's point, when it passes the same checks as every source. */
export function usableOverride(
  overrides: Map<string, { lat: number; lon: number }>,
  key: string,
): { lat: number; lon: number } | null {
  const override = overrides.get(key);

  return override ? sanitizeCoordinates(override.lat, override.lon) : null;
}
