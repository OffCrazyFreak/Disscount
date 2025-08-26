import { z } from "zod";

// Pinned Store schemas
export const pinnedStoreRequestSchema = z.object({
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
export const pinnedPlaceRequestSchema = z.object({
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
export type PinnedStoreRequest = z.infer<typeof pinnedStoreRequestSchema>;
export type PinnedStoreDto = z.infer<typeof pinnedStoreDtoSchema>;
export type BulkPinnedStoreRequest = z.infer<
  typeof bulkPinnedStoreRequestSchema
>;

export type PinnedPlaceRequest = z.infer<typeof pinnedPlaceRequestSchema>;
export type PinnedPlaceDto = z.infer<typeof pinnedPlaceDtoSchema>;
export type BulkPinnedPlaceRequest = z.infer<
  typeof bulkPinnedPlaceRequestSchema
>;

// Combined user preferences form schema (UI-facing)
export const userPreferencesSchema = z.object({
  pinnedStores: z.array(z.string()),
  pinnedPlaces: z.array(z.string()),
});

export type UserPreferencesFormType = z.infer<typeof userPreferencesSchema>;
