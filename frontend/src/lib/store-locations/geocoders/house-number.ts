import { parseAddress } from "@/lib/store-locations/address-key";

/** The house number asked for, e.g. "44a", or null for "bb" and no number. */
export function requestedHouseNumber(address: string): string | null {
  return parseAddress(address).number;
}

/** Compares a geocoder's house number with the requested one, "44 A" == "44a". */
export function houseNumberMatches(
  requested: string,
  returned: unknown,
): boolean {
  if (typeof returned !== "string") return false;

  // Nominatim may return several numbers for one object ("44;46"), so any may match.
  return returned
    .split(/[;,]/)
    .some((part) => parseAddress(`x ${part}`).number === requested);
}
