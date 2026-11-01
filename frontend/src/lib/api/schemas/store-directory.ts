import { z } from "zod";
import { storeResponseSchema } from "@/lib/cijene-api/schemas";

export const locationSourceSchema = z.enum([
  "upstream",
  "chain_locator",
  "dgu",
  "geoapify",
  "nominatim",
  "manual",
]);

const directoryStoreDto = storeResponseSchema
  .omit({ chain_code: true })
  .extend({
    chain: z.string(),
    locationSource: locationSourceSchema.nullable(),
  });

export const storeDirectoryResponse = z.object({
  stores: z.array(directoryStoreDto),
  generatedAt: z.iso.datetime(),
});

export type DirectoryStoreDto = z.infer<typeof directoryStoreDto>;
export type StoreDirectoryResponse = z.infer<typeof storeDirectoryResponse>;
