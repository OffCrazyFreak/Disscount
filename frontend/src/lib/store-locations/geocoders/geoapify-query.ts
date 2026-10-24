import { z } from "zod";

import { houseNumberMatches } from "@/lib/store-locations/geocoders/house-number";
import {
  isPlaceName,
  readPlacedAddress,
} from "@/lib/store-locations/sync/address-place";

// "B. RADICA 87, Viljevo": a village after the number, while upstream's town
// is the municipality.
const COMMA_VILLAGE = /^(.*\d.*?)\s*,\s*([^,\d]+)$/u;

/** The search text for an upstream address, and the house number to expect. */
export function geoapifyQuery(address: string, city: string | null) {
  let street = address
    .replace(/(?<=\p{L})(?=\d)/gu, " ")
    .replace(/\.(?=\S)/g, ". ");

  const village = COMMA_VILLAGE.exec(street);
  const place = village && isPlaceName(village[2]) ? village[2].trim() : null;

  if (place && village) street = village[1];

  const parsed = readPlacedAddress(street);

  return {
    text: [street.trim(), place ?? city, "Hrvatska"].filter(Boolean).join(", "),
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
      confidence_street_level: z.number().optional(),
      confidence_city_level: z.number().optional(),
    })
    .optional(),
});

export type IGeoapifyResult = z.infer<typeof geoapifyResultSchema>;

const BUILDING_TYPES = new Set(["building", "amenity"]);

// Geoapify says a low score does not mean a wrong answer, but a wrong pin is
// worse than none, so doubtful results are dropped.
const MIN_CONFIDENCE = 0.6;

// The overall score drops for the right building when it is not ranked first,
// so strong street and city scores also pass; below the first result they
// are the only way, so a confident answer for another street cannot slip in.
const MIN_STREET_AND_CITY = 0.8;

/** The first result that is the building asked for. */
export function pickGeoapifyResult(
  results: IGeoapifyResult[],
  houseNumbers: string[],
): IGeoapifyResult | undefined {
  return results.find((result, index) => {
    const rank = result.rank ?? {};
    const streetAndCity =
      (rank.confidence_street_level ?? 0) >= MIN_STREET_AND_CITY &&
      (rank.confidence_city_level ?? 0) >= MIN_STREET_AND_CITY;
    const confident =
      streetAndCity ||
      (index === 0 && (rank.confidence ?? 0) >= MIN_CONFIDENCE);

    return (
      confident &&
      BUILDING_TYPES.has(result.result_type ?? "") &&
      houseNumbers.some((wanted) =>
        houseNumberMatches(wanted, result.housenumber),
      )
    );
  });
}
