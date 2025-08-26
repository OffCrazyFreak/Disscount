import { z } from "zod";

// Watchlist schemas
export const watchlistItemRequestSchema = z.object({
  productApiId: z.string().min(1, "Product API ID je obavezan"),
  productName: z.string().min(1, "Naziv proizvoda je obavezan"),
});

export const watchlistItemDtoSchema = watchlistItemRequestSchema.extend({
  id: z.string(),
  userId: z.string(),
  lastNotifiedAt: z.string().optional(),
  createdAt: z.string(),
});

// Type exports
export type WatchlistItemRequest = z.infer<typeof watchlistItemRequestSchema>;
export type WatchlistItemDto = z.infer<typeof watchlistItemDtoSchema>;
