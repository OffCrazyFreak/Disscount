import { z } from "zod";

// Mirrors the backend's UserLimit enum; the contract test fails when the two drift.
export const userLimitSchema = z.enum([
  "SHOPPING_LISTS",
  "SHOPPING_LIST_ITEMS",
  "WATCHLIST_ITEMS",
  "DIGITAL_CARDS",
]);

export const limitReachedProblemSchema = z.object({
  status: z.literal(409),
  limit: userLimitSchema,
  max: z.number().int().positive(),
});

export type LimitReachedProblem = z.infer<typeof limitReachedProblemSchema>;
