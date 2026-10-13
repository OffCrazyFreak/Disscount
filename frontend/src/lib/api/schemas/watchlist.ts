import { z } from "zod";

// WatchType enum matching backend
export enum WatchType {
  percentage = "PERCENTAGE",
  absolute = "ABSOLUTE",
}

// Watchlist schemas
export const watchlistItemRequestSchema = z.object({
  productApiId: z.string().min(1, "watchlist.validation.productRequired"),
  watchType: z.enum(WatchType, {
    message: "watchlist.validation.watchTypeRequired",
  }),
  thresholdValue: z.number().positive("watchlist.validation.thresholdPositive"),
});

export const watchlistItemDtoSchema = watchlistItemRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
  lastNotifiedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// Type exports
export type WatchlistItemRequest = z.infer<typeof watchlistItemRequestSchema>;
export type WatchlistItemDto = z.infer<typeof watchlistItemDtoSchema>;
