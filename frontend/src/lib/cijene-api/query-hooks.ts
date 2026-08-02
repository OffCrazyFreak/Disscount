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
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { CACHE_TIMES } from "@/lib/query/cache-times";

export function useListChains() {
  return useQuery<ListChainsResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.chains,
    queryFn: listChains,
    staleTime: CACHE_TIMES.chains,
  });
}

export function useListStoresByChain(chainCode: string) {
  return useQuery<ListStoresResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.storesByChain(chainCode),
    queryFn: () => listStoresByChain(chainCode),
    enabled: Boolean(chainCode),
    staleTime: CACHE_TIMES.stores,
  });
}

/**
 * Single hook that does both "search" and "list all":
 *  • useStores()        → list all
 *  • useStores(filters) → apply filters
 */
export function useSearchStores(params?: SearchStoresParams) {
  return useQuery<ListStoresResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.stores(params),
    queryFn: () => searchStores(params),
    // enable when no params or when any non-empty filter provided
    enabled:
      params === undefined ||
      Object.keys(params).length === 0 ||
      Object.values(params).some((v) => v != null && v !== ""),
    staleTime: CACHE_TIMES.stores,
  });
}

export function useGetProductByEan(params: GetProductParams) {
  return useQuery<ProductResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.productByEan(params),
    queryFn: () => getProductByEan(params),
    enabled: Boolean(params.ean),
    staleTime: CACHE_TIMES.products,
  });
}

export function useGetProductByName(params: SearchProductsParams) {
  return useQuery<ProductSearchResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.productSearch(params),
    queryFn: () => getProductByName(params),
    enabled: Boolean(params.q),
    staleTime: CACHE_TIMES.products,
  });
}

export function useGetPrices(params: GetPricesParams) {
  return useQuery<StorePricesResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.prices(params),
    queryFn: () => getPrices(params),
    enabled: Boolean(params.eans),
    staleTime: CACHE_TIMES.products,
  });
}

export function useGetChainStats() {
  return useQuery<ChainStatsResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.chainStats,
    queryFn: getChainStats,
    staleTime: CACHE_TIMES.products,
  });
}

export function useHealthCheck() {
  return useQuery<HealthCheckResponse, Error>({
    queryKey: CIJENE_QUERY_KEYS.health,
    queryFn: healthCheck,
    staleTime: CACHE_TIMES.health,
  });
}
