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
