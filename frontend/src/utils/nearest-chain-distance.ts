import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import { distanceKm, type ILatLon } from "@/utils/distance";
import { toStoreKey } from "@/utils/store-key";

interface ILocatedStore {
  chain: string;
  code: string;
  lat: number | null;
  lon: number | null;
}

export interface INearestStore {
  /** `chain:code`, as `toStoreKey` builds it. */
  key: string;
  km: number;
}

export function nearestStoreByChain(
  origin: ILatLon,
  stores: Iterable<ILocatedStore>,
): Map<string, INearestStore> {
  const nearest = new Map<string, INearestStore>();

  for (const store of stores) {
    if (store.lat == null || store.lon == null) continue;

    const km = distanceKm(origin, { lat: store.lat, lon: store.lon });
    const known = nearest.get(store.chain);

    if (known === undefined || km < known.km) {
      nearest.set(store.chain, {
        key: toStoreKey(store.chain, store.code),
        km,
      });
    }
  }

  return nearest;
}

/** The directory corrects upstream's pins, so upstream's coordinates only stand in for a store it lacks. */
export function locatePricedStores(
  prices: StorePrice[],
  directory: DirectoryStoreDto[],
): ILocatedStore[] {
  const byKey = new Map(
    directory.map((store) => [toStoreKey(store.chain, store.code), store]),
  );

  return prices.map((price) => {
    const listed = byKey.get(toStoreKey(price.chain, price.store.code));

    return {
      chain: price.chain,
      code: price.store.code,
      lat: listed ? listed.lat : price.store.lat,
      lon: listed ? listed.lon : price.store.lon,
    };
  });
}
