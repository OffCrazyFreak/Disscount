import { z } from "zod";

// Pinned Store schemas
const pinnedStoreRequestSchema = z.object({
  storeApiId: z.string().min(1, "Store API ID je obavezan"),
  storeName: z.string().min(1, "Naziv trgovine je obavezan"),
});

export const pinnedStoreDtoSchema = pinnedStoreRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
});

export const bulkPinnedStoreRequestSchema = z.object({
  stores: z.array(pinnedStoreRequestSchema),
});

// Pinned Place schemas
const pinnedPlaceRequestSchema = z.object({
  placeApiId: z.string().min(1, "Place API ID je obavezan"),
  placeName: z.string().min(1, "Naziv mjesta je obavezan"),
});

export const pinnedPlaceDtoSchema = pinnedPlaceRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
});

export const bulkPinnedPlaceRequestSchema = z.object({
  places: z.array(pinnedPlaceRequestSchema),
});

// Type exports
export type PinnedStoreDto = z.infer<typeof pinnedStoreDtoSchema>;
export type BulkPinnedStoreRequest = z.infer<
  typeof bulkPinnedStoreRequestSchema
>;

export type PinnedPlaceDto = z.infer<typeof pinnedPlaceDtoSchema>;
export type BulkPinnedPlaceRequest = z.infer<
  typeof bulkPinnedPlaceRequestSchema
>;
