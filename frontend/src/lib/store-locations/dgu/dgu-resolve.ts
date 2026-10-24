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

/** Picks each target's address among the register's candidates, if one is safe. */
export function resolveCandidates(
  targets: IDguTarget[],
  candidates: IDguCandidate[],
  names: Map<number, string>,
): Map<string, { lat: number; lon: number }> {
  const byTarget = new Map<number, IDguCandidate[]>();

  for (const candidate of candidates) {
    const list = byTarget.get(candidate.target);

    if (list) list.push(candidate);
    else byTarget.set(candidate.target, [candidate]);
  }

  const result = new Map<string, { lat: number; lon: number }>();

  for (const [index, list] of byTarget) {
    const winner = pickCandidate(
      list,
      normalizeCity(targets[index].city),
      names,
    );

    if (!winner) continue;

    const { lat, lon } = etrs89LaeaToWgs84(winner.northing, winner.easting);
    const point = sanitizeCoordinates(lat, lon);

    if (point) result.set(targets[index].id, point);
  }

  return result;
}

function pickCandidate(
  list: IDguCandidate[],
  city: string,
  names: Map<number, string>,
): IDguCandidate | undefined {
  // Without a city, a single hit is the only one safe enough to trust.
  if (!city) return list.length === 1 ? list[0] : undefined;

  const inTown = list.filter((candidate) =>
    candidate.refs.some((ref) => names.get(ref) === city),
  );
  const exact = inTown.filter((candidate) => candidate.exact);
  const pool = exact.length > 0 ? exact : inTown;

  return spreadMetres(pool) <= MAX_SPREAD_M ? pool[0] : undefined;
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
