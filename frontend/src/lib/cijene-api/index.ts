import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  cijeneApiV0Client,
  cijeneApiHealthClient,
  cijeneApiClient,
} from "@/lib/cijene-api/client";
import {
  ListChainsResponse,
  ListStoresResponse,
  ProductResponse,
  ProductSearchResponse,
  StorePricesResponse,
  ChainStatsResponse,
  ListArchivesResponse,
  HealthCheckResponse,
  GetProductParams,
  SearchProductsParams,
  SearchStoresParams,
  GetPricesParams,
  listChainsResponseSchema,
  listStoresResponseSchema,
  productResponseSchema,
  productSearchResponseSchema,
  storePricesResponseSchema,
  chainStatsResponseSchema,
  listArchivesResponseSchema,
  healthCheckResponseSchema,
  getProductParamsSchema,
  searchProductsParamsSchema,
  searchStoresParamsSchema,
  getPricesParamsSchema,
} from "@/lib/cijene-api/schemas";

// API Functions

/**
 * List available ZIP archives
 */
export const listArchives = async (): Promise<ListArchivesResponse> => {
  const response = await cijeneApiV0Client.get("/list");
  return listArchivesResponseSchema.parse(response.data);
};

/**
 * List all retail chains
 */
export const listChains = async (): Promise<ListChainsResponse> => {
  const response = await cijeneApiClient.get("/chains/");
  return listChainsResponseSchema.parse(response.data);
};

/**
 * List stores for a specific chain
 */
export const listStoresByChain = async (
  chainCode: string
): Promise<ListStoresResponse> => {
  const response = await cijeneApiClient.get(`/${chainCode}/stores/`);
  return listStoresResponseSchema.parse(response.data);
};

/**
 * Search stores with filters
 */
export const searchStores = async (
  params: SearchStoresParams
): Promise<ListStoresResponse> => {
  const validatedParams = searchStoresParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await cijeneApiClient.get(
    `/stores?${queryParams.toString()}`
  );
  return listStoresResponseSchema.parse(response.data);
};

/**
 * List all stores from all chains
 */
export const listAllStores = async (): Promise<ListStoresResponse> => {
  const response = await cijeneApiClient.get(`/stores`);
  return listStoresResponseSchema.parse(response.data);
};

/**
 * Get product data/prices by barcode (EAN)
 */
export const getProductByEan = async (
  params: GetProductParams
): Promise<ProductResponse> => {
  const validatedParams = getProductParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  if (validatedParams.date) queryParams.append("date", validatedParams.date);
  if (validatedParams.chains)
    queryParams.append("chains", validatedParams.chains);

  const response = await cijeneApiClient.get(
    `/products/${validatedParams.ean}?${queryParams.toString()}`
  );
  return productResponseSchema.parse(response.data);
};

/**
 * Get product prices by store with filtering
 */
export const getPrices = async (
  params: GetPricesParams
): Promise<StorePricesResponse> => {
  const validatedParams = getPricesParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await cijeneApiClient.get(
    `/prices?${queryParams.toString()}`
  );
  return storePricesResponseSchema.parse(response.data);
};

/**
 * Get chain statistics
 */
export const getChainStats = async (): Promise<ChainStatsResponse> => {
  const response = await cijeneApiClient.get("/chain-stats/");
  return chainStatsResponseSchema.parse(response.data);
};

/**
 * Search products API function
 */
export const searchProductsApi = async (
  params: SearchProductsParams
): Promise<ProductSearchResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("q", params.q);
  if (params.date) queryParams.append("date", params.date);
  if (params.chains) queryParams.append("chains", params.chains);

  const response = await axios.get(`/api/products?${queryParams.toString()}`);
  return response.data;
};

/**
 * Health check API function
 */
export const healthCheckApi = async (): Promise<HealthCheckResponse> => {
  const response = await axios.get("/api/health");
  return healthCheckResponseSchema.parse(response.data);
};

// React Query Hooks

/**
 * Hook to list archives
 */
export const useListArchives = () => {
  return useQuery<ListArchivesResponse, Error>({
    queryKey: ["cijene", "archives"],
    queryFn: listArchives,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to list chains
 */
export const useListChains = () => {
  return useQuery<ListChainsResponse, Error>({
    queryKey: ["cijene", "chains"],
    queryFn: listChains,
    staleTime: 60 * 60 * 1000, // 1 hour - chains don't change often
  });
};

/**
 * Hook to list stores by chain
 */
export const useListStoresByChain = (chainCode: string) => {
  return useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", "chain", chainCode],
    queryFn: () => listStoresByChain(chainCode),
    enabled: !!chainCode,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to search stores
 */
export const useSearchStores = (params: SearchStoresParams) => {
  return useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", "search", params],
    queryFn: () => searchStores(params),
    enabled: !!(
      params.chains ||
      params.city ||
      params.address ||
      (params.lat && params.lon)
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to list all stores from all chains
 */
export const useListAllStores = () => {
  return useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", "all"],
    queryFn: () => listAllStores(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to get product by EAN
 */
export const useGetProductByEan = (params: GetProductParams) => {
  return useQuery<ProductResponse, Error>({
    queryKey: ["cijene", "product", "ean", params],
    queryFn: () => getProductByEan(params),
    enabled: !!params.ean,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

/**
 * Hook to search products
 */
export const useSearchProducts = (params: SearchProductsParams) => {
  return useQuery<ProductSearchResponse, Error>({
    queryKey: ["cijene", "products", "search", params],
    queryFn: () => searchProductsApi(params),
    enabled: !!params.q,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

/**
 * Hook to get prices
 */
export const useGetPrices = (params: GetPricesParams) => {
  return useQuery<StorePricesResponse, Error>({
    queryKey: ["cijene", "prices", params],
    queryFn: () => getPrices(params),
    enabled: !!params.eans,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

/**
 * Hook to get chain stats
 */
export const useGetChainStats = () => {
  return useQuery<ChainStatsResponse, Error>({
    queryKey: ["cijene", "chain-stats"],
    queryFn: getChainStats,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
};

/**
 * Hook to check health
 */
export const useHealthCheck = () => {
  return useQuery<HealthCheckResponse, Error>({
    queryKey: ["cijene", "health"],
    queryFn: healthCheckApi,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once for health checks
  });
};

// Service object with all functions and hooks
const cijeneService = {
  // API functions
  listArchives,

  listChains,
  listStoresByChain,
  searchStores,
  listAllStores,
  getProductByEan,
  getPrices,
  getChainStats,

  searchProductsApi,
  healthCheckApi,

  // React Query hooks
  useListArchives,

  useListChains,
  useListStoresByChain,
  useSearchStores,
  useListAllStores,
  useGetProductByEan,
  useSearchProducts,
  useGetPrices,
  useGetChainStats,

  useHealthCheck,
};

export default cijeneService;
