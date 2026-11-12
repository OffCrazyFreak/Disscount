import type {
  GetPricesParams,
  GetProductParams,
  SearchProductsParams,
  SearchStoresParams,
} from "@/lib/cijene-api/schemas";

function canonicalizeCsv(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
    .sort()
    .join(",");
}

/** One cache entry per set of products and chains, whatever order or spacing a caller used. */
export function canonicalizeStorePricesParams(
  params: GetPricesParams,
): GetPricesParams {
  return {
    ...params,
    eans: canonicalizeCsv(params.eans) ?? "",
    chains: canonicalizeCsv(params.chains),
    city: params.city?.trim(),
    address: params.address?.trim(),
  };
}

function productKey(params: GetProductParams) {
  return ["cijene", "product", "ean", JSON.stringify(params)] as const;
}

/** The persisted cache stores these exact values, so changing one strands every offline copy. */
export const CIJENE_QUERY_KEYS = {
  chains: ["cijene", "chains"] as const,
  chainStats: ["cijene", "chain-stats"] as const,
  health: ["cijene", "health"] as const,
  storeDirectory: ["cijene", "store-directory"] as const,
  storeHours: ["cijene", "store-hours"] as const,
  storesByChain: (chainCode: string) =>
    ["cijene", "stores", "chain", chainCode] as const,
  storeSearch: (params?: SearchStoresParams) =>
    ["cijene", "stores", params ? JSON.stringify(params) : "all"] as const,
  product: productKey,
  // Callers that already hold a product seed it here, so a modal opened from a card is instant.
  productByEan: (ean: string) => productKey({ ean }),
  productSearch: (params: SearchProductsParams) =>
    ["cijene", "products", "search", JSON.stringify(params)] as const,
  priceHistory: (ean: string, date: string) =>
    ["cijene", "product", "history", ean, date] as const,
  // The server seeds the product page under this key.
  productStorePrices: (params: GetPricesParams) =>
    [
      "cijene",
      "prices",
      "product",
      canonicalizeStorePricesParams(params),
    ] as const,
  locationPrices: (params: {
    eans: string;
    chains: string;
    cities: string[];
  }) => ["cijene", "prices", "locations", params] as const,
};
