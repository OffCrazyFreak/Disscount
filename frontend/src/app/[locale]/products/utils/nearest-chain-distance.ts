import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { StorePrice } from "@/lib/cijene-api/schemas";
import { distanceKm, type ILatLon } from "@/app/[locale]/map/utils/distance";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";

interface ILocatedStore {
  chain: string;
  lat: number | null;
  lon: number | null;
}

/** Kilometres from the origin to each chain's nearest store with coordinates. */
export function nearestDistanceByChain(
  origin: ILatLon,
  stores: Iterable<ILocatedStore>,
): Map<string, number> {
  const nearest = new Map<string, number>();

  for (const store of stores) {
    if (store.lat == null || store.lon == null) continue;

    const km = distanceKm(origin, { lat: store.lat, lon: store.lon });
    const known = nearest.get(store.chain);

    if (known === undefined || km < known) nearest.set(store.chain, km);
  }

  return nearest;
}

/**
 * The stores that priced a product, placed where the store directory puts
 * them: it corrects pins upstream lacks or gets wrong, so upstream's own
 * coordinates only stand in for a store the directory does not list.
 */
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
      lat: listed ? listed.lat : price.store.lat,
      lon: listed ? listed.lon : price.store.lon,
    };
  });
}
