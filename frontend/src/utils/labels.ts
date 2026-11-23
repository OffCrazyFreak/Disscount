import { locationNamesMap, storeNamesMap } from "@/constants/name-mappings";

/** Falls back to the raw code so a chain the mapping does not know still renders as something. */
export function getChainLabel(chainCode: string): string {
  return storeNamesMap[chainCode] || chainCode;
}

/** Store cities are nullable, so callers pick the fallback that suits the spot. */
export function getLocationLabel(
  city: string | null | undefined,
  fallback = "",
): string {
  if (!city) return fallback;

  return locationNamesMap[city] || city;
}

interface IStoreAddress {
  address: string | null;
  zipcode: string | null;
  cityLabel: string;
}

export function formatStoreAddress({
  address,
  zipcode,
  cityLabel,
}: IStoreAddress): string {
  const place = [zipcode, cityLabel].filter(Boolean).join(" ");

  return [address, place].filter(Boolean).join(", ");
}

// Past this share of capital letters a name was typed in caps lock, as most chain archives send them.
const SHOUTED_SHARE = 0.7;

function isShouted(name: string): boolean {
  const letters = name.match(/\p{L}/gu) ?? [];
  const capitals = letters.filter(
    (letter) => letter !== letter.toLowerCase(),
  ).length;

  return letters.length > 0 && capitals / letters.length >= SHOUTED_SHARE;
}

/** Sentence case for names sent in capitals, close to upstream's cleaned names; abbreviations go lower case too. */
export function getCatalogNameLabel(name: string): string {
  if (!isShouted(name)) return name;

  const sentence = name.toLowerCase();

  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
