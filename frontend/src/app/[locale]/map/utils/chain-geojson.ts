import { DirectoryStoreDto } from "@/lib/api/schemas";
import { toStoreKey } from "@/app/[locale]/map/utils/store-key";

export interface IStoreFeatureProperties {
  key: string;
  chain: string;
}

export interface IStoreFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: IStoreFeatureProperties;
  }>;
}

/**
 * One collection per chain, because clustering runs per source: a cluster
 * then always means "N stores of this chain" and can wear that chain's logo,
 * which a mixed cluster could not.
 */
export function groupStoresByChain(
  stores: DirectoryStoreDto[],
): Map<string, IStoreFeatureCollection> {
  const groups = new Map<string, IStoreFeatureCollection>();

  for (const store of stores) {
    if (store.lat == null || store.lon == null) continue;

    let collection = groups.get(store.chain);

    if (!collection) {
      collection = { type: "FeatureCollection", features: [] };
      groups.set(store.chain, collection);
    }

    collection.features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [store.lon, store.lat] },
      properties: {
        key: toStoreKey(store.chain, store.code),
        chain: store.chain,
      },
    });
  }

  return groups;
}
