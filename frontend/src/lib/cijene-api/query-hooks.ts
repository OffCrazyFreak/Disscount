import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import {
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
import {
  CIJENE_QUERY_KEYS,
  canonicalizeStorePricesParams,
} from "@/lib/cijene-api/keys";

function chainsQueryOptions() {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.chains,
    queryFn: listChains,
    staleTime: 60 * 60 * 1000, // 1 hour - chains don't change often
  });
}

function storesByChainQueryOptions(chainCode: string) {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.storesByChain(chainCode),
    queryFn: () => listStoresByChain(chainCode),
    enabled: Boolean(chainCode),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

function storeSearchQueryOptions(params?: SearchStoresParams) {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.storeSearch(params),
    queryFn: () => searchStores(params),
    // enable when no params or when any non-empty filter provided
    enabled:
      params === undefined ||
      Object.keys(params).length === 0 ||
      Object.values(params).some((v) => v != null && v !== ""),
    staleTime: 30 * 60 * 1000,
  });
}

export function productByEanQueryOptions(params: GetProductParams) {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.product(params),
    queryFn: () => getProductByEan(params),
    enabled: Boolean(params.ean),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

function productSearchQueryOptions(searchParams: SearchProductsParams) {
  const hasQuery = searchParams.q.length > 0;

  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.productSearch(searchParams),
    queryFn: () => getProductByName(searchParams),
    enabled: hasQuery,
    // Old results stay on screen while the next search loads; none show while the search is cleared.
    placeholderData: hasQuery ? keepPreviousData : undefined,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

function storePricesQueryOptions(params: GetPricesParams) {
  const canonicalParams = canonicalizeStorePricesParams(params);

  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.productStorePrices(canonicalParams),
    queryFn: () => getPrices(canonicalParams),
    enabled: Boolean(canonicalParams.eans),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

function chainStatsQueryOptions() {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.chainStats,
    queryFn: getChainStats,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

function healthCheckQueryOptions() {
  return queryOptions({
    queryKey: CIJENE_QUERY_KEYS.health,
    queryFn: healthCheck,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for health checks
  });
}

export function useListChains() {
  return useQuery(chainsQueryOptions());
}

export function useListStoresByChain(chainCode: string) {
  return useQuery(storesByChainQueryOptions(chainCode));
}

/**
 * Single hook that does both "search" and "list all":
 *  • useStores()        → list all
 *  • useStores(filters) → apply filters
 */
export function useSearchStores(params?: SearchStoresParams) {
  return useQuery(storeSearchQueryOptions(params));
}

export function useGetProductByEan(params: GetProductParams) {
  return useQuery(productByEanQueryOptions(params));
}

export function useGetProductByName(params: SearchProductsParams) {
  return useQuery(productSearchQueryOptions({ ...params, q: params.q.trim() }));
}

export function useGetPrices(params: GetPricesParams) {
  return useQuery(storePricesQueryOptions(params));
}

export function useGetChainStats() {
  return useQuery(chainStatsQueryOptions());
}

export function useHealthCheck() {
  return useQuery(healthCheckQueryOptions());
}
