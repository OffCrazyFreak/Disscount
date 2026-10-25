import "server-only";

import { fetchStream } from "@/lib/store-locations/http";
import {
  addressesMatch,
  matchedOnlyByStem,
  normalizeCity,
  parseAddress,
  type IParsedAddress,
} from "@/lib/store-locations/address-key";
import {
  componentRefs,
  featureId,
  houseNumber,
  kindOf,
  STREET_KIND,
  pointNorthingEasting,
  spellingText,
} from "@/lib/store-locations/dgu/gml-fields";
import {
  resolveCandidates,
  type IDguResult,
} from "@/lib/store-locations/dgu/dgu-resolve";
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
): Promise<IDguResult> {
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
        exact: !matchedOnlyByStem(parsed[target].tokens, street.tokens),
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

// Copies a string so it no longer references the text chunk it was cut from.
function flat(text: string): string {
  return Buffer.from(text).toString();
}
