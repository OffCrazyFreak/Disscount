import { getLocationLabel } from "@/utils/labels";
import { compareHr, normalizeForSearch } from "@/utils/strings";
import { readMainCounty, readPostalArea } from "@/utils/postcodes";
import { townKey, type IStoreTown } from "@/utils/store-towns";

interface IPlaceStore {
  city: string | null;
  zipcode: string | null;
}

export type PlaceOption = Pick<IStoreTown, "key" | "name" | "county">;

/** The plain name a saved place filters and highlights stores by. */
export function readPlaceName(key: string) {
  return key.split("|")[0];
}

/** The id keeps a namesake's postal area; filters read the plain name. */
export function toPinnedPlaces(keys: string[]) {
  return keys.map((key) => ({
    placeApiId: key,
    placeName: readPlaceName(key),
  }));
}

/**
 * The places a shopper can save: one per name, split by county only where
 * stores of that name sit in more than one postal area. A value saved before
 * the split stays on offer, so it can still be seen and removed.
 */
export function listPlaceOptions(
  names: string[],
  stores: IPlaceStore[],
  saved: string[],
): PlaceOption[] {
  const postcodesByName = new Map<string, Map<string, string[]>>();
  for (const store of stores) {
    const area = readPostalArea(store.zipcode);
    if (!area || !store.zipcode) continue;

    // Folded as the distance sort folds them, so both agree on what clashes.
    const name = normalizeForSearch(getLocationLabel(store.city?.trim()));
    const areas = postcodesByName.get(name) ?? new Map<string, string[]>();
    areas.set(area, [...(areas.get(area) ?? []), store.zipcode]);
    postcodesByName.set(name, areas);
  }

  const options = [...names].sort(compareHr).flatMap<PlaceOption>((name) => {
    const areas = [...(postcodesByName.get(normalizeForSearch(name)) ?? [])];
    if (areas.length < 2) return [{ key: name, name, county: null }];

    return areas
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([area, postcodes]) => ({
        key: townKey(name, area),
        name,
        county: readMainCounty(postcodes),
      }));
  });
  const keys = new Set(options.map((option) => option.key));
  const orphans = saved
    .filter((key) => !keys.has(key))
    .map((key) => ({ key, name: readPlaceName(key), county: null }));

  return [...options, ...orphans];
}
