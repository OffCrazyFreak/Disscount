import POSTCODE_COUNTIES from "@/constants/postcode-counties.json";
import {
  COUNTY_BY_GEONAMES_CODE,
  isGeoNamesCountyCode,
  type County,
} from "@/constants/counties";

const countyCodeByPostcode: Record<string, string> = POSTCODE_COUNTIES;

/**
 * The county of a postcode on the GeoNames list; null for any other, so a
 * typo such as Umag's 51470 counts as no postcode at all.
 */
export function readCounty(zipcode: string | null): County | null {
  const code = countyCodeByPostcode[zipcode?.trim() ?? ""];

  return code && isGeoNamesCountyCode(code)
    ? COUNTY_BY_GEONAMES_CODE[code]
    : null;
}

/** The first two digits of a known postcode, the postal centre it belongs to. */
export function readPostalArea(zipcode: string | null): string | null {
  const postcode = zipcode?.trim() ?? "";

  return readCounty(postcode) ? postcode.slice(0, 2) : null;
}

/** The county most of these postcodes are in; area 10 spans two. */
export function readMainCounty(zipcodes: (string | null)[]): County | null {
  const counts = new Map<County, number>();
  for (const zipcode of zipcodes) {
    const county = readCounty(zipcode);
    if (county) counts.set(county, (counts.get(county) ?? 0) + 1);
  }

  return [...counts].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}
