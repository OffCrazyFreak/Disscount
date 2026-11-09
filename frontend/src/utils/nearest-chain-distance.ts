import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import { distanceKm, type ILatLon } from "@/utils/distance";
import { toStoreKey } from "@/utils/store-key";

interface ILocatedStore {
  chain: string;
  code: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
}

export interface INearestStore {
  /** `chain:code`, as `toStoreKey` builds it. */
  key: string;
  km: number;
  address: string | null;
  city: string | null;
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
        address: store.address,
        city: store.city,
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
    const store = listed ?? price.store;

    return {
      chain: price.chain,
      code: price.store.code,
      address: store.address,
      city: store.city,
      lat: store.lat,
      lon: store.lon,
    };
  });
}
