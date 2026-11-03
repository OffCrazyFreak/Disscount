import type { ILatLon } from "@/utils/distance";
import { compareHr } from "@/utils/strings";
import { getLocationLabel } from "@/utils/labels";

interface ITownStore {
  city: string | null;
  zipcode: string | null;
  lat: number | null;
  lon: number | null;
}

export interface IStoreTown {
  name: string;
  zipcodes: string[];
}

function isPinned(
  store: ITownStore,
): store is ITownStore & { lat: number; lon: number } {
  return store.lat != null && store.lon != null;
}

/**
 * The towns that have at least one store with a pin, so every town on offer
 * has a centre. Names match the ones pinned places are saved under.
 */
export function listStoreTowns(stores: ITownStore[]): IStoreTown[] {
  const zipcodesByTown = new Map<string, Set<string>>();

  for (const store of stores) {
    const name = getLocationLabel(store.city?.trim());
    if (!name || !isPinned(store)) continue;

    const zipcodes = zipcodesByTown.get(name) ?? new Set<string>();
    if (store.zipcode) zipcodes.add(store.zipcode.trim());
    zipcodesByTown.set(name, zipcodes);
  }

  return [...zipcodesByTown]
    .map(([name, zipcodes]) => ({ name, zipcodes: [...zipcodes].sort() }))
    .sort((a, b) => compareHr(a.name, b.name));
}

/**
 * The middle of a town's pinned stores. Towns are known only by name, so this
 * stands in for a geocoder and sends nothing anywhere.
 */
export function townCenter(stores: ITownStore[], town: string): ILatLon | null {
  const inTown = stores
    .filter(isPinned)
    .filter((store) => getLocationLabel(store.city?.trim()) === town);
  if (inTown.length === 0) return null;

  return {
    lat: inTown.reduce((sum, store) => sum + store.lat, 0) / inTown.length,
    lon: inTown.reduce((sum, store) => sum + store.lon, 0) / inTown.length,
  };
}
