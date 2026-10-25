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

/** Every placed store in one collection, so nearby chains cluster together. */
export function toStoreCollection(
  stores: DirectoryStoreDto[],
): IStoreFeatureCollection {
  const features: IStoreFeatureCollection["features"] = [];

  for (const store of stores) {
    if (store.lat == null || store.lon == null) continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [store.lon, store.lat] },
      properties: {
        key: toStoreKey(store.chain, store.code),
        chain: store.chain,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
