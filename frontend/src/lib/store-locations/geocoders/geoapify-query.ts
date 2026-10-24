import {
  houseNumberMatches,
  requestedHouseNumber,
} from "@/lib/store-locations/geocoders/house-number";

// Geoapify's docs say uncommon abbreviations lower its confidence even when
// the answer is right, so the common Croatian ones are spelled out.
const ABBREVIATIONS: [RegExp, string][] = [
  [/(^|\s)ul\.\s*/giu, "$1Ulica "],
  [/(^|\s)nas\.\s*/giu, "$1Naselje "],
  [/(^|\s)sv\.\s*/giu, "$1Svetog "],
];

// "B. RADICA 87, Viljevo": a village after the number, while upstream's town
// is the municipality.
const COMMA_VILLAGE = /^(.*\d.*?)\s*,\s*([^,\d]+)$/u;

/** The search text for an upstream address, and the house number to expect. */
export function geoapifyQuery(address: string, city: string | null) {
  let street = address.replace(/(?<=\p{L})(?=\d)/gu, " ");

  for (const [pattern, word] of ABBREVIATIONS) {
    street = street.replace(pattern, word);
  }

  street = street.replace(/\.(?=\S)/g, ". ");

  const village = COMMA_VILLAGE.exec(street);
  const place = village ? village[2].trim() : city;

  if (village) street = village[1];

  return {
    text: [street.trim(), place, "Hrvatska"].filter(Boolean).join(", "),
    houseNumber: requestedHouseNumber(street),
  };
}

export interface IGeoapifyResult {
  lat: number;
  lon: number;
  result_type?: string;
  housenumber?: string;
  rank?: {
    confidence?: number;
    confidence_street_level?: number;
    confidence_city_level?: number;
  };
}

const BUILDING_TYPES = new Set(["building", "amenity"]);

/**
 * The first result that is the building asked for. Strong street and city
 * confidence also passes, because the overall score drops for the right
 * building when it is not ranked first.
 */
export function pickGeoapifyResult(
  results: IGeoapifyResult[],
  houseNumber: string | null,
): IGeoapifyResult | undefined {
  if (houseNumber === null) return undefined;

  return results.find((result) => {
    const rank = result.rank ?? {};
    const confident =
      (rank.confidence ?? 0) >= 0.6 ||
      ((rank.confidence_street_level ?? 0) >= 0.8 &&
        (rank.confidence_city_level ?? 0) >= 0.8);

    return (
      confident &&
      BUILDING_TYPES.has(result.result_type ?? "") &&
      houseNumberMatches(houseNumber, result.housenumber)
    );
  });
}
