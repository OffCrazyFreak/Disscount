import { z } from "zod";

// External Product Chain schema
export const externalProductChainSchema = z.object({
  chain: z.string(),
  code: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  unit: z.string().nullable(),
  quantity: z.string().nullable(),
  min_price: z.string(),
  max_price: z.string(),
  avg_price: z.string(),
  price_date: z.string().optional(), // Only present in search results
});

// External Product schema
export const externalProductSchema = z.object({
  ean: z.string(),
  brand: z.string().nullable(),
  name: z.string(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  chains: z.array(externalProductChainSchema),
});

// Search parameters schema
export const searchExternalProductsParamsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  date: z.string().optional(), // YYYY-MM-DD format
  chains: z.string().optional(), // Comma-separated list of chain codes
});

// Get product by EAN parameters schema
export const getExternalProductParamsSchema = z.object({
  ean: z.string().min(1, "EAN is required"),
  date: z.string().optional(), // YYYY-MM-DD format
  chains: z.string().optional(), // Comma-separated list of chain codes
});

// Search response schema (object with products array)
export const searchExternalProductsResponseSchema = z.object({
  products: z.array(externalProductSchema),
});

// Type exports
export type ExternalProductChain = z.infer<typeof externalProductChainSchema>;
export type ExternalProduct = z.infer<typeof externalProductSchema>;
export type SearchExternalProductsResponse = z.infer<
  typeof searchExternalProductsResponseSchema
>;
export type SearchExternalProductsParams = z.infer<
  typeof searchExternalProductsParamsSchema
>;
export type GetExternalProductParams = z.infer<
  typeof getExternalProductParamsSchema
>;
