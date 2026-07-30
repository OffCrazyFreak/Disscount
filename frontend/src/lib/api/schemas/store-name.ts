import { z } from "zod";

export const storeNameSuggestionSchema = z.object({
  name: z.string(),
  usageCount: z.number().int(),
});

export type StoreNameSuggestion = z.infer<typeof storeNameSuggestionSchema>;
