import { normalizeCity } from "@/lib/store-locations/address-key";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { etrs89LaeaToWgs84 } from "@/lib/store-locations/dgu/laea";
import type {
  IDguCandidate,
  IDguTarget,
} from "@/lib/store-locations/dgu/dgu-types";

// The same street and number can exist in several villages of one town's
// area; farther apart than this, picking one would be a guess.
const MAX_SPREAD_M = 300;

type Point = { lat: number; lon: number };

export interface IDguResult {
  found: Map<string, Point>;
  /** Targets whose town has the address in far-apart places, with each place. */
  ambiguous: Map<string, Point[]>;
}

/** Picks each target's address among the register's candidates, if one is safe. */
export function resolveCandidates(
  targets: IDguTarget[],
  candidates: IDguCandidate[],
  names: Map<number, string>,
): IDguResult {
  const byTarget = new Map<number, IDguCandidate[]>();

  for (const candidate of candidates) {
    const list = byTarget.get(candidate.target);

    if (list) list.push(candidate);
    else byTarget.set(candidate.target, [candidate]);
  }

  const found = new Map<string, Point>();
  const ambiguous = new Map<string, Point[]>();

  for (const [index, list] of byTarget) {
    const id = targets[index].id;
    const pool = candidatePool(list, normalizeCity(targets[index].city), names);
    const points = pool.flatMap((candidate) => toPoint(candidate) ?? []);

    if (points.length === 0) continue;

    if (spreadMetres(pool) <= MAX_SPREAD_M) found.set(id, points[0]);
    else ambiguous.set(id, points);
  }

  return { found, ambiguous };
}

function toPoint(candidate: IDguCandidate): Point | null {
  const { lat, lon } = etrs89LaeaToWgs84(candidate.northing, candidate.easting);

  return sanitizeCoordinates(lat, lon);
}

function candidatePool(
  list: IDguCandidate[],
  city: string,
  names: Map<number, string>,
): IDguCandidate[] {
  // Without a city, a single hit is the only one safe enough to trust.
  if (!city) return list.length === 1 ? list : [];

  const inTown = list.filter((candidate) =>
    candidate.refs.some((ref) => names.get(ref) === city),
  );
  const exact = inTown.filter((candidate) => candidate.exact);

  return exact.length > 0 ? exact : inTown;
}

// The register's coordinates are metres (EPSG:3035), so plain distances work.
function spreadMetres(list: IDguCandidate[]): number {
  let spread = 0;

  for (const a of list) {
    for (const b of list) {
      spread = Math.max(
        spread,
        Math.hypot(a.northing - b.northing, a.easting - b.easting),
      );
    }
  }

  return spread;
}

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
