import { getLocationLabel } from "@/utils/labels";
import { compareHr, normalizeForSearch } from "@/utils/strings";
import { readCounty } from "@/utils/postcodes";
import type { County } from "@/constants/counties";
import type { IStoreTown } from "@/utils/store-towns";
import { findTownByKey, townKey, type IKeyedTown } from "@/utils/town-keys";

interface IPlaceStore {
  city: string | null;
  zipcode: string | null;
}

export type PlaceOption = Pick<IStoreTown, "key" | "name" | "county">;

/** The plain name a saved place filters and highlights stores by. */
export function readPlaceName(key: string) {
  return key.split("|")[0];
}

/** The id keeps a namesake's county; filters read the plain name. */
export function toPinnedPlaces(keys: string[]) {
  return keys.map((key) => ({
    placeApiId: key,
    placeName: readPlaceName(key),
  }));
}

function groupPostcodesByCounty(stores: IPlaceStore[]) {
  const byName = new Map<string, Map<County, string[]>>();
  for (const store of stores) {
    const county = readCounty(store.zipcode);
    if (!county || !store.zipcode) continue;

    // Folded as the distance sort folds them, so both agree on what clashes.
    const name = normalizeForSearch(getLocationLabel(store.city?.trim()));
    const counties = byName.get(name) ?? new Map<County, string[]>();
    counties.set(county, [...(counties.get(county) ?? []), store.zipcode]);
    byName.set(name, counties);
  }

  return byName;
}

/**
 * The places a shopper can save: one per name, split by county only where
 * stores of that name sit in more than one county. A value saved under an
 * older key takes the place of the option it names; one that names nothing
 * stays on offer, so it can still be seen and removed.
 */
export function listPlaceOptions(
  names: string[],
  stores: IPlaceStore[],
  saved: string[],
): PlaceOption[] {
  const postcodesByName = groupPostcodesByCounty(stores);

  const options = [...names]
    .sort(compareHr)
    .flatMap<IKeyedTown & PlaceOption>((name) => {
      const counties = [
        ...(postcodesByName.get(normalizeForSearch(name)) ?? []),
      ];
      if (counties.length < 2) {
        return [
          { key: name, name, county: null, homeCounty: null, zipcodes: [] },
        ];
      }

      return counties
        .map(([county, postcodes]) => ({
          key: townKey(name, county),
          name,
          county,
          homeCounty: county,
          zipcodes: [...postcodes].sort(),
        }))
        .sort((a, b) => a.zipcodes[0].localeCompare(b.zipcodes[0]));
    });

  const keys = new Set(options.map((option) => option.key));
  const orphans: PlaceOption[] = [];
  for (const key of saved) {
    if (keys.has(key)) continue;

    const named = key.includes("|") ? findTownByKey(options, key) : undefined;
    if (named && !saved.includes(named.key)) named.key = key;
    else orphans.push({ key, name: readPlaceName(key), county: null });
  }

  return [
    ...options.map(({ key, name, county }) => ({ key, name, county })),
    ...orphans,
  ];
}
