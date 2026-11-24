import { z } from "zod";

export const favoriteStoreDtoSchema = z.object({
  id: z.string(),
  /** The store's chain and code, as the map keys it ("konzum:123"). */
  storeKey: z.string(),
});

export const bulkFavoriteStoreRequestSchema = z.object({
  stores: z.array(z.object({ storeKey: z.string().min(1) })),
});

export type FavoriteStoreDto = z.infer<typeof favoriteStoreDtoSchema>;
export type BulkFavoriteStoreRequest = z.infer<
  typeof bulkFavoriteStoreRequestSchema
>;
