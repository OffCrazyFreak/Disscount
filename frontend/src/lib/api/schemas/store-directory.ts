import { z } from "zod";

export const locationSourceSchema = z.enum([
  "upstream",
  "chain_locator",
  "dgu",
  "geoapify",
  "nominatim",
  "manual",
]);

const directoryStoreDto = z.object({
  chain: z.string(),
  code: z.string(),
  type: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  zipcode: z.string().nullable(),
  phone: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  locationSource: locationSourceSchema.nullable(),
});

export const storeDirectoryResponse = z.object({
  stores: z.array(directoryStoreDto),
  generatedAt: z.iso.datetime(),
});

export type DirectoryStoreDto = z.infer<typeof directoryStoreDto>;
export type StoreDirectoryResponse = z.infer<typeof storeDirectoryResponse>;
