import type { ILatLon } from "@/utils/distance";
import { compareHr, normalizeForSearch } from "@/utils/strings";
import { getLocationLabel } from "@/utils/labels";
import type { County } from "@/constants/counties";
import { readCounty } from "@/utils/postcodes";
import { findTownByKey, townKey, type IKeyedTown } from "@/utils/town-keys";

interface ITownStore {
  city: string | null;
  zipcode: string | null;
  lat: number | null;
  lon: number | null;
}

type PinnedStore = ITownStore & { lat: number; lon: number };

export interface IStoreTown {
  /** Unique: the name, plus "|" and the county when another town shares it. */
  key: string;
  name: string;
  /** Set only when another town shares the name, to tell them apart. */
  county: County | null;
  zipcodes: string[];
}

interface ITownGroup extends IStoreTown, IKeyedTown {
  stores: PinnedStore[];
}

function isPinned(store: ITownStore): store is PinnedStore {
  return store.lat != null && store.lon != null;
}

function countAccents(name: string) {
  return [...name].filter(
    (char) => normalizeForSearch(char) !== char.toLowerCase(),
  ).length;
}

function isCapitals(name: string) {
  return name === name.toUpperCase() && name !== name.toLowerCase();
}

interface ISpelledGroup {
  spellings: Map<string, number>;
  stores: PinnedStore[];
}

// Chains sending ASCII only ("Plaski") would split a town from its accented spelling, so names group folded.
function groupByFoldedName(stores: ITownStore[]) {
  const byName = new Map<string, ISpelledGroup>();

  for (const store of stores) {
    const name = getLocationLabel(store.city?.trim());
    if (!name || !isPinned(store)) continue;

    const folded = normalizeForSearch(name);
    const group: ISpelledGroup = byName.get(folded) ?? {
      spellings: new Map(),
      stores: [],
    };
    group.spellings.set(name, (group.spellings.get(name) ?? 0) + 1);
    group.stores.push(store);
    byName.set(folded, group);
  }

  // The accented spelling wins, then one not in capitals, then the one most stores send.
  return [...byName.values()].map(({ spellings, stores: inTown }) => ({
    name: [...spellings].sort(
      ([a, aCount], [b, bCount]) =>
        countAccents(b) - countAccents(a) ||
        Number(isCapitals(a)) - Number(isCapitals(b)) ||
        bCount - aCount ||
        compareHr(a, b),
    )[0][0],
    stores: inTown,
  }));
}

function splitByCounty(stores: PinnedStore[]) {
  const byCounty = new Map<County | null, PinnedStore[]>();

  for (const store of stores) {
    const county = readCounty(store.zipcode);
    byCounty.set(county, [...(byCounty.get(county) ?? []), store]);
  }

  const withoutPostcode = byCounty.get(null) ?? [];
  byCounty.delete(null);
  // A store without a postcode joins its town only when the name is unambiguous.
  if (byCounty.size <= 1) {
    const county = [...byCounty.keys()][0] ?? null;
    byCounty.set(county, [...(byCounty.get(county) ?? []), ...withoutPostcode]);
  }

  return byCounty;
}

function groupTowns(stores: ITownStore[]): ITownGroup[] {
  return groupByFoldedName(stores).flatMap(({ name, stores: named }) => {
    const byCounty = splitByCounty(named);
    const isShared = byCounty.size > 1;

    return [...byCounty].map(([county, inTown]) => ({
      key: isShared ? townKey(name, county) : name,
      name,
      county: isShared ? county : null,
      homeCounty: county,
      zipcodes: [
        ...new Set(inTown.flatMap((store) => store.zipcode?.trim() || [])),
      ].sort(),
      stores: inTown,
    }));
  });
}

/** Only towns with a pinned store, so each has a centre; names match what pinned places are saved under. */
export function listStoreTowns(stores: ITownStore[]): IStoreTown[] {
  return groupTowns(stores)
    .sort(
      (a, b) =>
        compareHr(a.name, b.name) ||
        (a.zipcodes[0] ?? "").localeCompare(b.zipcodes[0] ?? ""),
    )
    .map(({ key, name, county, zipcodes }) => ({
      key,
      name,
      county,
      zipcodes,
    }));
}

/** Towns are known only by name, so this stands in for a geocoder and sends nothing anywhere. */
export function townCenter(
  stores: ITownStore[],
  key: string,
): (ILatLon & Pick<IStoreTown, "name" | "county">) | null {
  const town = findTownByKey(groupTowns(stores), key);
  if (!town) return null;

  const inTown = town.stores;

  return {
    lat: inTown.reduce((sum, store) => sum + store.lat, 0) / inTown.length,
    lon: inTown.reduce((sum, store) => sum + store.lon, 0) / inTown.length,
    name: town.name,
    county: town.county,
  };
}
