import type { ILatLon } from "@/utils/distance";
import { compareHr } from "@/utils/strings";
import { getLocationLabel } from "@/utils/labels";
import {
  COUNTY_BY_POSTAL_AREA,
  type County,
  type PostalArea,
} from "@/constants/counties";

interface ITownStore {
  city: string | null;
  zipcode: string | null;
  lat: number | null;
  lon: number | null;
}

type PinnedStore = ITownStore & { lat: number; lon: number };

export interface IStoreTown {
  /** Unique: the name, plus "|" and the postal area when another town shares it. */
  key: string;
  name: string;
  /** Set only when another town shares the name, to tell them apart. */
  county: County | null;
  zipcodes: string[];
}

interface ITownGroup extends IStoreTown {
  area: PostalArea | null;
  stores: PinnedStore[];
}

function isPinned(store: ITownStore): store is PinnedStore {
  return store.lat != null && store.lon != null;
}

function isPostalArea(digits: string): digits is PostalArea {
  return digits in COUNTY_BY_POSTAL_AREA;
}

/** The first two postcode digits, which name one county; null when unknown. */
export function readPostalArea(zipcode: string | null): PostalArea | null {
  const digits = zipcode?.trim().slice(0, 2) ?? "";

  return isPostalArea(digits) ? digits : null;
}

/** How a saved place names one of several towns that share a name. */
export function townKey(name: string, area: PostalArea | null) {
  return area ? `${name}|${area}` : name;
}

function parseTownKey(key: string) {
  const [name, area = null] = key.split("|");

  return { name, area };
}

function groupByName(stores: ITownStore[]) {
  const byName = new Map<string, PinnedStore[]>();

  for (const store of stores) {
    const name = getLocationLabel(store.city?.trim());
    if (!name || !isPinned(store)) continue;

    byName.set(name, [...(byName.get(name) ?? []), store]);
  }

  return [...byName].map(([name, inTown]) => ({ name, stores: inTown }));
}

function splitByArea(stores: PinnedStore[]) {
  const byArea = new Map<PostalArea | null, PinnedStore[]>();

  for (const store of stores) {
    const area = readPostalArea(store.zipcode);
    byArea.set(area, [...(byArea.get(area) ?? []), store]);
  }

  const withoutPostcode = byArea.get(null) ?? [];
  byArea.delete(null);
  // A store without a postcode joins its town only when the name is unambiguous.
  if (byArea.size <= 1) {
    const area = [...byArea.keys()][0] ?? null;
    byArea.set(area, [...(byArea.get(area) ?? []), ...withoutPostcode]);
  }

  return byArea;
}

function groupTowns(stores: ITownStore[]): ITownGroup[] {
  return groupByName(stores).flatMap(({ name, stores: named }) => {
    const byArea = splitByArea(named);
    const isShared = byArea.size > 1;

    return [...byArea].map(([area, inTown]) => ({
      key: isShared ? townKey(name, area) : name,
      name,
      county: isShared && area ? COUNTY_BY_POSTAL_AREA[area] : null,
      area,
      zipcodes: [
        ...new Set(inTown.flatMap((store) => store.zipcode?.trim() || [])),
      ].sort(),
      stores: inTown,
    }));
  });
}

/**
 * The towns that have at least one store with a pin, so every town on offer
 * has a centre. Names match the ones pinned places are saved under.
 */
export function listStoreTowns(stores: ITownStore[]): IStoreTown[] {
  return groupTowns(stores)
    .sort((a, b) => compareHr(a.name, b.name) || compareHr(a.key, b.key))
    .map(({ key, name, county, zipcodes }) => ({
      key,
      name,
      county,
      zipcodes,
    }));
}

function findTown(towns: ITownGroup[], key: string) {
  const exact = towns.find((town) => town.key === key);
  if (exact) return exact;

  const { name, area } = parseTownKey(key);
  const named = towns
    .filter((town) => town.name === name)
    .sort((a, b) => compareHr(a.area ?? "", b.area ?? ""));

  // A saved place from before namesakes were told apart knows only the name.
  return named.find((town) => town.area === area) ?? named[0];
}

/**
 * The middle of a town's pinned stores, found by its key. Towns are known
 * only by name, so this stands in for a geocoder and sends nothing anywhere.
 */
export function townCenter(
  stores: ITownStore[],
  key: string,
): (ILatLon & Pick<IStoreTown, "name" | "county">) | null {
  const town = findTown(groupTowns(stores), key);
  if (!town) return null;

  const inTown = town.stores;

  return {
    lat: inTown.reduce((sum, store) => sum + store.lat, 0) / inTown.length,
    lon: inTown.reduce((sum, store) => sum + store.lon, 0) / inTown.length,
    name: town.name,
    county: town.county,
  };
}
