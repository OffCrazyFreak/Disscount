import { COUNTY_BY_POSTAL_AREA, type PostalArea } from "@/constants/counties";
import { getLocationLabel } from "@/utils/labels";
import { compareHr, normalizeForSearch } from "@/utils/strings";
import { readPostalArea, townKey, type IStoreTown } from "@/utils/store-towns";

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
  const areasByName = new Map<string, Set<PostalArea>>();
  for (const store of stores) {
    const area = readPostalArea(store.zipcode);
    if (!area) continue;

    // Folded as the distance sort folds them, so both agree on what clashes.
    const name = normalizeForSearch(getLocationLabel(store.city?.trim()));
    areasByName.set(name, (areasByName.get(name) ?? new Set()).add(area));
  }

  const options = [...names].sort(compareHr).flatMap<PlaceOption>((name) => {
    const areas = [...(areasByName.get(normalizeForSearch(name)) ?? [])].sort();
    if (areas.length < 2) return [{ key: name, name, county: null }];

    return areas.map((area) => ({
      key: townKey(name, area),
      name,
      county: COUNTY_BY_POSTAL_AREA[area],
    }));
  });
  const keys = new Set(options.map((option) => option.key));
  const orphans = saved
    .filter((key) => !keys.has(key))
    .map((key) => ({ key, name: readPlaceName(key), county: null }));

  return [...options, ...orphans];
}
