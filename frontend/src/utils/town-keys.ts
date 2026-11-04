import { normalizeForSearch } from "@/utils/strings";
import { COUNTY_BY_GEONAMES_CODE, type County } from "@/constants/counties";
import { readAreaCounties } from "@/utils/postcodes";

export interface IKeyedTown {
  key: string;
  name: string;
  /** The county the town is grouped under; null when no postcode is known. */
  homeCounty: County | null;
  /** Sorted, so the first is the lowest. */
  zipcodes: string[];
}

const COUNTIES = new Set<string>(Object.values(COUNTY_BY_GEONAMES_CODE));

function isCounty(value: string): value is County {
  return COUNTIES.has(value);
}

/** How a saved place names one of several towns that share a name. */
export function townKey(name: string, county: County | null) {
  return county ? `${name}|${county}` : name;
}

// Older saved places carry a two digit postal area instead ("Sveta Nedelja|52"), so both forms keep resolving.
function readQualifierCounties(qualifier: string | undefined): County[] {
  if (!qualifier) return [];
  if (isCounty(qualifier)) return [qualifier];

  return /^\d{2}$/.test(qualifier) ? readAreaCounties(qualifier) : [];
}

/** A key that no longer matches resolves by folded name within its county or postal area, then to the namesake with the lowest postcode. */
export function findTownByKey<T extends IKeyedTown>(
  towns: T[],
  key: string,
): T | undefined {
  const exact = towns.find((town) => town.key === key);
  if (exact) return exact;

  const [name, qualifier] = key.split("|");
  const counties = readQualifierCounties(qualifier);
  const named = towns
    .filter(
      (town) => normalizeForSearch(town.name) === normalizeForSearch(name),
    )
    .sort((a, b) => (a.zipcodes[0] ?? "").localeCompare(b.zipcodes[0] ?? ""));

  return (
    named.find(
      (town) => town.homeCounty && counties.includes(town.homeCounty),
    ) ?? named[0]
  );
}
