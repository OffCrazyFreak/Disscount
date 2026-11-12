import { z } from "zod";

export const listChainsResponseSchema = z.object({
  chains: z.array(z.string()),
});

export type ListChainsResponse = z.infer<typeof listChainsResponseSchema>;

const storeFields = {
  code: z.string(),
  type: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  zipcode: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  phone: z.string().nullable(),
};

const storeSchema = z.object({ chain_id: z.number(), ...storeFields });

export const storeResponseSchema = z.object({
  chain_code: z.string(),
  ...storeFields,
});

export const listStoresResponseSchema = z.object({
  stores: z.array(storeResponseSchema),
});

export type StoreResponse = z.infer<typeof storeResponseSchema>;
export type ListStoresResponse = z.infer<typeof listStoresResponseSchema>;

// Upstream serialises Python Decimals: dot-decimal text such as "1.29", rarely "1E+1".
const PRICE_TEXT = /^\d+(\.\d+)?(E[+-]?\d+)?$/i;

const chainProductResponseSchema = z.object({
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
  price_date: z.iso.date(),
});

export const productResponseSchema = z.object({
  ean: z.string(),
  brand: z.string().nullable(),
  name: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  // An unreadable price is dropped, because it would be NaN in every total and sort; a shape change still fails loudly.
  chains: z
    .array(chainProductResponseSchema)
    .transform((chains) =>
      chains.filter((chain) =>
        [chain.min_price, chain.max_price, chain.avg_price].every((price) =>
          PRICE_TEXT.test(price),
        ),
      ),
    ),
});

export const productSearchResponseSchema = z.object({
  products: z.array(productResponseSchema),
});

export type ChainProductResponse = z.infer<typeof chainProductResponseSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type ProductSearchResponse = z.infer<typeof productSearchResponseSchema>;

const storePriceSchema = z.object({
  chain: z.string(),
  ean: z.string(),
  price_date: z.iso.date(),
  regular_price: z.string().nullable(),
  special_price: z.string().nullable(),
  unit_price: z.string().nullable(),
  best_price_30: z.string().nullable(),
  anchor_price: z.string().nullable(),
  store: storeSchema,
});

export const storePricesResponseSchema = z.object({
  store_prices: z.array(storePriceSchema),
});

export type StorePrice = z.infer<typeof storePriceSchema>;
export type StorePricesResponse = z.infer<typeof storePricesResponseSchema>;

// Our /api/cijene/location-prices route, which reduces store prices per city
const priceRangeSchema = z.object({ min: z.number(), max: z.number() });

export const locationPricesResponseSchema = z.object({
  /** Lowest and highest shelf price per EAN across the requested cities */
  prices: z.record(z.string(), priceRangeSchema),
  /** Some cities could not be loaded, so the ranges may be incomplete */
  partial: z.boolean(),
});

export type PriceRange = z.infer<typeof priceRangeSchema>;
export type LocationPricesResponse = z.infer<
  typeof locationPricesResponseSchema
>;

const chainStatsSchema = z.object({
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

const archiveInfoSchema = z.object({
  date: z.string(),
  url: z.string(),
  size: z.number(),
  updated: z.string(),
});

export const listArchivesResponseSchema = z.object({
  archives: z.array(archiveInfoSchema),
});

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

export const healthCheckResponseSchema = z.object({
  status: z.string().optional(),
  message: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
