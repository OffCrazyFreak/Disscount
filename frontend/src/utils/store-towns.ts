import type { ILatLon } from "@/utils/distance";
import { compareHr } from "@/utils/strings";
import { getLocationLabel } from "@/utils/labels";

interface ITownStore {
  city: string | null;
  zipcode: string | null;
  lat: number | null;
  lon: number | null;
}

type PinnedStore = ITownStore & { lat: number; lon: number };

export interface IStoreTown {
  name: string;
  /** Unique, so it also names the town when picked: the name, plus a postcode only when another town shares it. */
  label: string;
  zipcodes: string[];
}

interface ITownGroup extends IStoreTown {
  stores: PinnedStore[];
}

function isPinned(store: ITownStore): store is PinnedStore {
  return store.lat != null && store.lon != null;
}

// The first two digits follow the postal centre, which keeps one county's
// Sveta Nedelja apart from another's while a city's own postcodes stay one town.
function postalArea(store: ITownStore) {
  return store.zipcode?.trim().slice(0, 2) ?? "";
}

function groupTowns(stores: ITownStore[]): ITownGroup[] {
  const areasByName = new Map<string, Map<string, PinnedStore[]>>();

  for (const store of stores) {
    const name = getLocationLabel(store.city?.trim());
    if (!name || !isPinned(store)) continue;

    const areas = areasByName.get(name) ?? new Map<string, PinnedStore[]>();
    const area = postalArea(store);
    areas.set(area, [...(areas.get(area) ?? []), store]);
    areasByName.set(name, areas);
  }

  return [...areasByName].flatMap(([name, areas]) => {
    const withoutPostcode = areas.get("") ?? [];
    areas.delete("");
    // A store without a postcode joins its town only when the name is unambiguous.
    if (areas.size <= 1) {
      const area = [...areas.keys()][0] ?? "";
      areas.set(area, [...(areas.get(area) ?? []), ...withoutPostcode]);
    }

    return [...areas.values()].map((inTown) => {
      const zipcodes = [
        ...new Set(inTown.flatMap((store) => store.zipcode?.trim() || [])),
      ].sort();
      const label = areas.size > 1 ? `${name} (${zipcodes[0]})` : name;

      return { name, label, zipcodes, stores: inTown };
    });
  });
}

/**
 * The towns that have at least one store with a pin, so every town on offer
 * has a centre. Names match the ones pinned places are saved under.
 */
export function listStoreTowns(stores: ITownStore[]): IStoreTown[] {
  return groupTowns(stores)
    .map(({ name, label, zipcodes }) => ({ name, label, zipcodes }))
    .sort((a, b) => compareHr(a.label, b.label));
}

/**
 * The middle of a town's pinned stores, found by its label or, for a saved
 * place that only knows the name, the first town of that name by postcode.
 * Towns are known only by name, so this stands in for a geocoder and sends
 * nothing anywhere.
 */
export function townCenter(
  stores: ITownStore[],
  town: string,
): (ILatLon & { label: string }) | null {
  const towns = groupTowns(stores);
  const found =
    towns.find((candidate) => candidate.label === town) ??
    towns
      .filter((candidate) => candidate.name === town)
      .sort((a, b) => compareHr(a.label, b.label))[0];
  if (!found) return null;

  const inTown = found.stores;

  return {
    lat: inTown.reduce((sum, store) => sum + store.lat, 0) / inTown.length,
    lon: inTown.reduce((sum, store) => sum + store.lon, 0) / inTown.length,
    label: found.label,
  };
}
