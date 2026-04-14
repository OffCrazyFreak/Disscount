import { z } from "zod";

// Base schemas
export const validationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const httpValidationErrorSchema = z.object({
  detail: z.array(validationErrorSchema).optional(),
});

// Chain schemas
export const listChainsResponseSchema = z.object({
  chains: z.array(z.string()),
});

// Store schemas
export const chainSchema = z.object({
  chain_id: z.number(),
  code: z.string(),
  type: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  zipcode: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  phone: z.string().nullable(),
});

export const chainResponseSchema = z.object({
  chain_code: z.string(),
  code: z.string(),
  type: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  zipcode: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  phone: z.string().nullable(),
});

export const listStoresResponseSchema = z.object({
  stores: z.array(chainResponseSchema),
});

export type Chain = z.infer<typeof chainSchema>;
export type ChainResponse = z.infer<typeof chainResponseSchema>;
export type ListChainsResponse = z.infer<typeof listStoresResponseSchema>;

// Product schemas
export const chainProductResponseSchema = z.object({
  chain: z.string(),
  code: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  unit: z.string().nullable(),
  quantity: z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
  }, z.number().nullable()),
  min_price: z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
  }, z.number()),
  max_price: z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
  }, z.number()),
  avg_price: z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
  }, z.number()),
  price_date: z.iso.date(),
});

export const productResponseSchema = z.object({
  ean: z.string(),
  brand: z.string().nullable(),
  name: z.string().nullable(),
  quantity: z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      return isNaN(num) ? null : num;
    }
    return val;
  }, z.number().nullable()),
  unit: z.string().nullable(),
  chains: z.array(chainProductResponseSchema),
});

export const productSearchResponseSchema = z.object({
  products: z.array(productResponseSchema),
});

export type ChainProductResponse = z.infer<typeof chainProductResponseSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductSearchResponse = z.infer<typeof productSearchResponseSchema>;

// Price schemas
export const storePriceSchema = z.object({
  chain: z.string(),
  ean: z.string(),
  price_date: z.iso.date(),
  regular_price: z.string().nullable(),
  special_price: z.string().nullable(),
  unit_price: z.string().nullable(),
  best_price_30: z.string().nullable(),
  anchor_price: z.string().nullable(),
  store: chainSchema,
});

export const storePricesResponseSchema = z.object({
  store_prices: z.array(storePriceSchema),
});

export type StorePrice = z.infer<typeof storePriceSchema>;
export type StorePricesResponse = z.infer<typeof storePricesResponseSchema>;

// Chain stats schemas
export const chainStatsSchema = z.object({
  chain_code: z.string(),
  price_date: z.iso.date(),
  price_count: z.number().int(),
  store_count: z.number().int(),
  created_at: z.iso.datetime(),
});

export const chainStatsResponseSchema = z.object({
  chain_stats: z.array(chainStatsSchema),
});

export type ChainStats = z.infer<typeof chainStatsSchema>;
export type ChainStatsResponse = z.infer<typeof chainStatsResponseSchema>;

// Archive schemas
export const archiveInfoSchema = z.object({
  date: z.string(),
  url: z.string(),
  size: z.number(),
  updated: z.string(),
});

export const listArchivesResponseSchema = z.object({
  archives: z.array(archiveInfoSchema),
});

export type ArchiveInfo = z.infer<typeof archiveInfoSchema>;
export type ListArchivesResponse = z.infer<typeof listArchivesResponseSchema>;

// API parameter schemas
export const getProductParamsSchema = z.object({
  ean: z.string(),
  date: z.iso.date().optional(),
  chains: z.string().optional(),
});

export const searchProductsParamsSchema = z.object({
  q: z.string(),
  date: z.iso.date().optional(),
  chains: z.string().optional(),
  fuzzy: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
});

export const searchStoresParamsSchema = z.object({
  chains: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  d: z.number().default(10).optional(),
});

export const getPricesParamsSchema = z.object({
  eans: z.string(),
  chains: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  d: z.number().default(10).optional(),
});

export type GetProductParams = z.infer<typeof getProductParamsSchema>;
export type SearchProductsParams = z.infer<typeof searchProductsParamsSchema>;
export type SearchStoresParams = z.infer<typeof searchStoresParamsSchema>;
export type GetPricesParams = z.infer<typeof getPricesParamsSchema>;

// Health check schema
export const healthCheckResponseSchema = z.object({
  status: z.string().optional(),
  message: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
