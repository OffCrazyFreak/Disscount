import { z } from "zod";

import { houseNumberMatches } from "@/lib/store-locations/geocoders/house-number";
import { readPlacedAddress } from "@/lib/store-locations/sync/address-place";

/** The search text for an upstream address, and the house numbers to expect. */
export function geoapifyQuery(address: string, city: string | null) {
  const parsed = readPlacedAddress(address);

  return {
    text: [address, city, "Hrvatska"].filter(Boolean).join(", "),
    // "Ulica 1. svibnja bb" names a number in the street, so "bb" decides.
    // Either end of "75-77" may be the one Geoapify returns.
    houseNumbers:
      parsed.numberless || !parsed.number
        ? []
        : [parsed.number, ...(parsed.rangeEnd ? [parsed.rangeEnd] : [])],
  };
}

export const geoapifyResultSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  result_type: z.string().optional(),
  housenumber: z.string().optional(),
  rank: z
    .object({
      confidence: z.number().optional(),
      confidence_building_level: z.number().optional(),
    })
    .optional(),
});

export type IGeoapifyResult = z.infer<typeof geoapifyResultSchema>;

const BUILDING_TYPES = new Set(["building", "amenity"]);

// Geoapify says a low score does not mean a wrong answer, but a wrong pin is
// worse than none, so doubtful results are dropped.
const MIN_CONFIDENCE = 0.6;

// Wrong "building" results scored lower on the building itself; 0 means only the street matched.
const MIN_BUILDING_CONFIDENCE = 0.9;

/** The top result, when it is the building asked for. */
export function pickGeoapifyResult(
  results: IGeoapifyResult[],
  houseNumbers: string[],
): IGeoapifyResult | undefined {
  const [top] = results;
  const rank = top?.rank ?? {};

  const building =
    top !== undefined &&
    (rank.confidence ?? 0) >= MIN_CONFIDENCE &&
    (rank.confidence_building_level ?? 0) >= MIN_BUILDING_CONFIDENCE &&
    BUILDING_TYPES.has(top.result_type ?? "") &&
    houseNumbers.some((wanted) => houseNumberMatches(wanted, top.housenumber));

  return building ? top : undefined;
}
