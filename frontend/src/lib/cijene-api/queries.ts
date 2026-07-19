import axios from "axios";
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
  listChainsResponseSchema,
  listStoresResponseSchema,
  productResponseSchema,
  storePricesResponseSchema,
  chainStatsResponseSchema,
  healthCheckResponseSchema,
  getProductParamsSchema,
  searchStoresParamsSchema,
  getPricesParamsSchema,
} from "@/lib/cijene-api/schemas";

export async function listChains(): Promise<ListChainsResponse> {
  const response = await axios.get("/api/cijene/chains");
  return listChainsResponseSchema.parse(response.data);
}

export async function listStoresByChain(
  chainCode: string,
): Promise<ListStoresResponse> {
  const response = await axios.get(`/api/cijene/stores/${chainCode}`);
  return listStoresResponseSchema.parse(response.data);
}

export async function searchStores(
  params?: SearchStoresParams,
): Promise<ListStoresResponse> {
  // default to empty filter object
  const validated = searchStoresParamsSchema.parse(params ?? {});
  const filteredParams = Object.fromEntries(
    Object.entries(validated).filter(([, v]) => v != null && v !== ""),
  );

  const response = await axios.get("/api/cijene/stores", {
    params: filteredParams,
  });
  return listStoresResponseSchema.parse(response.data);
}

export async function getProductByEan(
  params: GetProductParams,
): Promise<ProductResponse> {
  const validatedParams = getProductParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  if (validatedParams.date) queryParams.append("date", validatedParams.date);
  if (validatedParams.chains)
    queryParams.append("chains", validatedParams.chains);

  const response = await axios.get(
    `/api/cijene/products/${validatedParams.ean}?${queryParams.toString()}`,
  );
  return productResponseSchema.parse(response.data);
}

export async function getProductByName(
  params: SearchProductsParams,
): Promise<ProductSearchResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("q", params.q);
  if (params.date) queryParams.append("date", params.date);
  if (params.chains) queryParams.append("chains", params.chains);
  if (params.fuzzy !== undefined)
    queryParams.append("fuzzy", params.fuzzy.toString());
  if (params.limit !== undefined)
    queryParams.append("limit", params.limit.toString());

  const response = await axios.get(
    `/api/cijene/products?${queryParams.toString()}`,
  );
  return response.data;
}

export async function getPrices(
  params: GetPricesParams,
): Promise<StorePricesResponse> {
  const validatedParams = getPricesParamsSchema.parse(params);

  const queryParams = new URLSearchParams();
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });

  const response = await axios.get(
    `/api/cijene/prices?${queryParams.toString()}`,
  );
  return storePricesResponseSchema.parse(response.data);
}

export async function getChainStats(): Promise<ChainStatsResponse> {
  const response = await axios.get("/api/cijene/chain-stats");
  return chainStatsResponseSchema.parse(response.data);
}

export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await axios.get("/api/cijene/health");
  return healthCheckResponseSchema.parse(response.data);
}
