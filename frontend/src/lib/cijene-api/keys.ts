import type {
  GetPricesParams,
  GetProductParams,
  SearchProductsParams,
  SearchStoresParams,
} from "@/lib/cijene-api/schemas";

// Allowlisted for offline persistence in lib/offline/cached-query-keys.ts, and
// treated as the public root that survives logout in lib/offline/purge.ts.
const ROOT = "cijene";

/**
 * Keys end in an explicit object of the optional filters rather than a
 * stringified params blob. React Query hashes object keys in sorted order and
 * skips undefined members, so a caller seeding the cache with `{ ean }` lands on
 * the same key a reader passing `{ ean, date: undefined }` looks up. The former
 * JSON.stringify(params) form keyed on argument shape instead, so seeding worked
 * only as long as every caller happened to pass the same fields.
 */
export const CIJENE_QUERY_KEYS = {
  all: [ROOT] as const,
  chains: [ROOT, "chains"] as const,
  chainStats: [ROOT, "chain-stats"] as const,
  health: [ROOT, "health"] as const,

  storesByChain: (chainCode: string) =>
    [ROOT, "stores", "chain", chainCode] as const,

  stores: (params?: SearchStoresParams) =>
    [
      ROOT,
      "stores",
      {
        chains: params?.chains,
        city: params?.city,
        address: params?.address,
        lat: params?.lat,
        lon: params?.lon,
        d: params?.d,
      },
    ] as const,

  productByEan: ({ ean, date, chains }: GetProductParams) =>
    [ROOT, "product", "ean", ean, { date, chains }] as const,

  productHistory: (ean: string, date: string) =>
    [ROOT, "product", "history", ean, date] as const,

  productSearch: ({ q, date, chains, fuzzy, limit }: SearchProductsParams) =>
    [ROOT, "products", "search", q, { date, chains, fuzzy, limit }] as const,

  prices: ({ eans, chains, city, address, lat, lon, d }: GetPricesParams) =>
    [ROOT, "prices", eans, { chains, city, address, lat, lon, d }] as const,
};
