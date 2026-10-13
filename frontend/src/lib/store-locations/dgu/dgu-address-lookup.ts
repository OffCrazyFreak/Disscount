import "server-only";

import { fetchStream } from "@/lib/store-locations/http";
import {
  addressesMatch,
  normalizeCity,
  parseAddress,
  type IParsedAddress,
} from "@/lib/store-locations/address-key";
import { etrs89LaeaToWgs84 } from "@/lib/store-locations/dgu/laea";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import {
  componentRefs,
  featureId,
  houseNumber,
  kindOf,
  STREET_KIND,
  pointNorthingEasting,
  spellingText,
} from "@/lib/store-locations/dgu/gml-fields";
import { createStreetIndex } from "@/lib/store-locations/dgu/dgu-street-index";
import { scanZipMembers } from "@/lib/store-locations/dgu/dgu-zip-stream";
import type {
  IDguCandidate,
  IDguTarget,
} from "@/lib/store-locations/dgu/dgu-types";

export type { IDguTarget } from "@/lib/store-locations/dgu/dgu-types";
export { DGU_ATTRIBUTION } from "@/lib/store-locations/dgu/dgu-attribution";

const DGU_ZIP_URL =
  "https://geoportal.dgu.hr/services/atom/INSPIRE_Addresses_(AD).zip";

/**
 * Looks targets up in the national address register (about 84 MB zip, 2.6 GB
 * of GML) in one streaming pass. Result keys are target ids.
 */
export async function lookupDguAddresses(
  targets: IDguTarget[],
  signal: AbortSignal,
): Promise<Map<string, { lat: number; lon: number }>> {
  const parsed = targets.map((target) => parseAddress(target.address));
  const streetIndex = createStreetIndex(parsed);

  // Only streets some target could be on are kept, so memory stays small.
  const streets = new Map<number, { tokens: string[]; targets: number[] }>();
  const names = new Map<number, string>();
  const candidates: IDguCandidate[] = [];
  let streetsSeen = false;

  function onStreet(member: string) {
    streetsSeen = true;

    const id = featureId(member);
    const name = spellingText(member);
    const match = id !== null && name ? streetIndex.match(name) : null;

    if (id !== null && match) streets.set(id, match);
  }

  function onName(member: string) {
    const id = featureId(member);
    const name = spellingText(member);

    if (id !== null && name) names.set(id, flat(normalizeCity(name)));
  }

  function onAddress(member: string) {
    // The zip lists thoroughfares before addresses; the filter relies on it.
    if (!streetsSeen) throw new Error("DGU zip lists addresses before streets");

    const refs = componentRefs(member);
    const street = refs
      .filter((ref) => kindOf(ref) === STREET_KIND)
      .map((ref) => streets.get(ref))
      .find(Boolean);

    if (!street) return;

    const number = parseAddress(`ulica ${houseNumber(member) ?? ""}`).number;
    const point = pointNorthingEasting(member);

    if (!number || !point) return;

    const dguAddress: IParsedAddress = { tokens: street.tokens, number };

    for (const target of street.targets) {
      if (!addressesMatch(parsed[target], dguAddress)) continue;

      candidates.push({
        target,
        northing: point[0],
        easting: point[1],
        refs: refs.filter((ref) => kindOf(ref) !== STREET_KIND),
      });
    }
  }

  const body = await fetchStream(DGU_ZIP_URL, signal);

  await scanZipMembers(
    body,
    {
      "PostalDescriptor.gml": onName,
      "ThoroughfareName.gml": onStreet,
      "Address.gml": onAddress,
      "AdminUnitName.gml": onName,
    },
    signal,
  );

  return resolveCandidates(targets, candidates, names);
}

function resolveCandidates(
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
    const city = normalizeCity(targets[index].city);

    // Without a city, a single hit is the only one safe enough to trust.
    const winner = city
      ? list.find((candidate) =>
          candidate.refs.some((ref) => names.get(ref) === city),
        )
      : list.length === 1
        ? list[0]
        : undefined;

    if (!winner) continue;

    const { lat, lon } = etrs89LaeaToWgs84(winner.northing, winner.easting);
    const point = sanitizeCoordinates(lat, lon);

    if (point) result.set(targets[index].id, point);
  }

  return result;
}

// Copies a string so it no longer references the text chunk it was cut from.
function flat(text: string): string {
  return Buffer.from(text).toString();
}
