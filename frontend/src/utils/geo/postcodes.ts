import POSTCODE_COUNTIES from "@/constants/postcode-counties.json";
import {
  COUNTY_BY_GEONAMES_CODE,
  isGeoNamesCountyCode,
  type County,
} from "@/constants/counties";

const countyCodeByPostcode: Record<string, string> = POSTCODE_COUNTIES;

/** Null for any postcode off the GeoNames list, so a typo such as Umag's 51470 counts as no postcode. */
export function readCounty(zipcode: string | null): County | null {
  const code = countyCodeByPostcode[zipcode?.trim() ?? ""];

  return code && isGeoNamesCountyCode(code)
    ? COUNTY_BY_GEONAMES_CODE[code]
    : null;
}

/** The counties a two digit postal area reaches into; area 10 spans two. */
export function readAreaCounties(area: string): County[] {
  return [
    ...new Set(
      Object.keys(countyCodeByPostcode).flatMap((postcode) =>
        postcode.startsWith(area) ? (readCounty(postcode) ?? []) : [],
      ),
    ),
  ];
}
