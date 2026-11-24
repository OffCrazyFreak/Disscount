import { z } from "zod";

export const storeNameSuggestionDtoSchema = z.object({
  name: z.string(),
});

export type StoreNameSuggestionDto = z.infer<
  typeof storeNameSuggestionDtoSchema
>;
