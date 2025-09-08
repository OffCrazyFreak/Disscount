import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  cijeneApiV0Client,
  cijeneApiHealthClient,
  cijeneApiV1Client,
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
export async function listArchives(): Promise<ListArchivesResponse> {
  const response = await axios.get("/api/cijene/archives");
  return listArchivesResponseSchema.parse(response.data);
};

/**
 * List all retail chains
 */
export async function listChains(): Promise<ListChainsResponse> {
  const response = await axios.get("/api/cijene/chains");
  return listChainsResponseSchema.parse(response.data);
};

/**
 * List stores for a specific chain
 */
export async function listStoresByChain(
  chainCode: string
): Promise<ListStoresResponse> {
  const response = await axios.get(`/api/cijene/stores/${chainCode}`);
  return listStoresResponseSchema.parse(response.data);
};

/**
 * Search stores with filters
 */
export async function searchStores(
  params?: SearchStoresParams
): Promise<ListStoresResponse> {
  // default to empty filter object
  const validated = searchStoresParamsSchema.parse(params ?? {});
  const qs = new URLSearchParams();
  Object.entries(validated).forEach(([k, v]) => {
    if (v != null && v !== "") qs.append(k, String(v));
  });

  const response = await axios.get(
    `/api/cijene/stores${qs.toString() && `?${qs}`}`
  );
  return listStoresResponseSchema.parse(response.data);
};

/**
 * Get product data/prices by barcode (EAN)
 */
export async function getProductByEan(
  params: GetProductParams
): Promise<ProductResponse> {
  const validatedParams = getProductParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  if (validatedParams.date) queryParams.append("date", validatedParams.date);
  if (validatedParams.chains)
    queryParams.append("chains", validatedParams.chains);

  const response = await axios.get(
    `/api/cijene/products/${validatedParams.ean}?${queryParams.toString()}`
  );
  return productResponseSchema.parse(response.data);
};

/**
 * Get products by name
 */
export async function getProductByName(
  params: SearchProductsParams
): Promise<ProductSearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("q", params.q);
  if (params.date) queryParams.append("date", params.date);
  if (params.chains) queryParams.append("chains", params.chains);

  const response = await axios.get(
    `/api/cijene/products?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Get product prices by store with filtering
 */
export async function getPrices(
  params: GetPricesParams
): Promise<StorePricesResponse> {
  const validatedParams = getPricesParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await axios.get(
    `/api/cijene/prices?${queryParams.toString()}`
  );
  return storePricesResponseSchema.parse(response.data);
};

/**
 * Get chain statistics
 */
export async function getChainStats(): Promise<ChainStatsResponse> {
  const response = await axios.get("/api/cijene/chain-stats");
  return chainStatsResponseSchema.parse(response.data);
};

/**
 * Health check
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await axios.get("/api/cijene/health");
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
 * Single hook that does both “search” and “list all”:
 *  • useStores()         → list all
 *  • useStores(filters) → apply filters
 */
export const useSearchStores = (params?: SearchStoresParams) =>
  useQuery<ListStoresResponse, Error>({
    queryKey: ["cijene", "stores", params ?? "all"],
    queryFn: () => searchStores(params),
    // only disable if you really want to wait for some param
    enabled: params === undefined || Object.values(params).some(Boolean),
    staleTime: 30 * 60 * 1000,
  });

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
export const useGetProductByName = (params: SearchProductsParams) => {
  return useQuery<ProductSearchResponse, Error>({
    queryKey: ["cijene", "products", "search", params],
    queryFn: () => getProductByName(params),
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
    queryFn: healthCheck,
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
  getProductByEan,
  getProductByName,
  getPrices,
  getChainStats,

  healthCheck,

  // React Query hooks
  useListArchives,

  useListChains,
  useListStoresByChain,
  useSearchStores,
  useGetProductByEan,
  useGetProductByName,
  useGetPrices,
  useGetChainStats,

  useHealthCheck,
};

export default cijeneService;
