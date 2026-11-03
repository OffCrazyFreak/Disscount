import { z } from "zod";

// WatchType enum matching backend
export enum WatchType {
  percentage = "PERCENTAGE",
  absolute = "ABSOLUTE",
}

// Watchlist schemas
const watchlistItemRequestSchema = z.object({
  productApiId: z.string().min(1, "watchlist.validation.productRequired"),
  watchType: z.enum(WatchType, {
    message: "watchlist.validation.watchTypeRequired",
  }),
  thresholdValue: z.number().positive("watchlist.validation.thresholdPositive"),
});

export const watchlistItemDtoSchema = watchlistItemRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
  // Spring always sends both keys; lastNotifiedAt is null until the first alert and updated_at is a nullable column.
  lastNotifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type WatchlistItemRequest = z.infer<typeof watchlistItemRequestSchema>;
export type WatchlistItemDto = z.infer<typeof watchlistItemDtoSchema>;
