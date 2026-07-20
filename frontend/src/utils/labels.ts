import { locationNamesMap, storeNamesMap } from "@/constants/name-mappings";

/**
 * Display name for a store chain, falling back to the raw code so a chain the
 * mapping does not know about still renders as something.
 */
export function getChainLabel(chainCode: string): string {
  return storeNamesMap[chainCode] || chainCode;
}

/**
 * Display name for a city, standardizing the messy values upstream sends.
 *
 * Store cities are nullable, so callers pass what they have and pick the
 * fallback that suits the spot (an empty string when sorting, a placeholder
 * when rendering).
 */
export function getLocationLabel(
  city: string | null | undefined,
  fallback = "",
): string {
  if (!city) return fallback;

  return locationNamesMap[city] || city;
}
