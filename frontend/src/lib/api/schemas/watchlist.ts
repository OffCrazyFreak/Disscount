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

// Its own object, so the form's rules never reject an item the server already stored.
export const watchlistItemDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productApiId: z.string(),
  watchType: z.enum(WatchType),
  thresholdValue: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export type WatchlistItemRequest = z.infer<typeof watchlistItemRequestSchema>;
export type WatchlistItemDto = z.infer<typeof watchlistItemDtoSchema>;
