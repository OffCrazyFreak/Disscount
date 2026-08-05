import { useQuery } from "@tanstack/react-query";
import {
  ListChainsResponse,
  ListStoresResponse,
  ProductResponse,
  ProductSearchResponse,
  StorePricesResponse,
  ChainStatsResponse,
  HealthCheckResponse,
  GetProductParams,
  SearchProductsParams,
  SearchStoresParams,
  GetPricesParams,
} from "@/lib/cijene-api/schemas";
import {
  listChains,
  listStoresByChain,
  searchStores,
  getProductByEan,
  getProductByName,
  getPrices,
  getChainStats,
  healthCheck,
} from "@/lib/cijene-api/queries";

export function useListChains() {
  return useQuery<ListChainsResponse, Error>({
    queryKey: ["cijene", "chains"],
    queryFn: listChains,
    staleTime: 60 * 60 * 1000, // 1 hour - chains don't change often
  });
}

export function useListStoresByChain(chainCode: string) {
  return useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", "chain", chainCode],
    queryFn: () => listStoresByChain(chainCode),
    enabled: Boolean(chainCode),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Single hook that does both "search" and "list all":
 *  • useStores()        → list all
 *  • useStores(filters) → apply filters
 */
export function useSearchStores(params?: SearchStoresParams) {
  return useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", params ? JSON.stringify(params) : "all"],
    queryFn: () => searchStores(params),
    // enable when no params or when any non-empty filter provided
    enabled:
      params === undefined ||
      Object.keys(params).length === 0 ||
      Object.values(params).some((v) => v != null && v !== ""),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Cache key for a single product by EAN. Shared so callers that already hold a
 * product (e.g. product cards) can seed the cache under the exact same key that
 * useGetProductByEan reads, making a URL-driven modal open instantly.
 */
export function productByEanQueryKey(ean: string) {
  return ["cijene", "product", "ean", JSON.stringify({ ean })];
}

export function useGetProductByEan(params: GetProductParams) {
  return useQuery<ProductResponse, Error>({
    queryKey: ["cijene", "product", "ean", JSON.stringify(params)],
    queryFn: () => getProductByEan(params),
    enabled: Boolean(params.ean),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

export function useGetProductByName(params: SearchProductsParams) {
  return useQuery<ProductSearchResponse, Error>({
    queryKey: ["cijene", "products", "search", JSON.stringify(params)],
    queryFn: () => getProductByName(params),
    enabled: Boolean(params.q),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

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

export function storePricesQueryKey(params: GetPricesParams) {
  return ["cijene", "prices", "search", canonicalizeStorePricesParams(params)];
}

function productStorePricesQueryKey(params: GetPricesParams) {
  return ["cijene", "prices", "product", canonicalizeStorePricesParams(params)];
}

export function useGetPrices(params: GetPricesParams) {
  const canonicalParams = canonicalizeStorePricesParams(params);

  return useQuery<StorePricesResponse, Error>({
    queryKey: productStorePricesQueryKey(canonicalParams),
    queryFn: () => getPrices(canonicalParams),
    enabled: Boolean(canonicalParams.eans),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

export function useGetChainStats() {
  return useQuery<ChainStatsResponse, Error>({
    queryKey: ["cijene", "chain-stats"],
    queryFn: getChainStats,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

export function useHealthCheck() {
  return useQuery<HealthCheckResponse, Error>({
    queryKey: ["cijene", "health"],
    queryFn: healthCheck,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for health checks
  });
}
