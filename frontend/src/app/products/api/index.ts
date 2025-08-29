import { useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosInstance } from "axios";
import {
  ExternalProduct,
  SearchExternalProductsParams,
  GetExternalProductParams,
  SearchExternalProductsResponse,
} from "../../../lib/api/schemas";

// Import ProductItem interface
interface ProductItem {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  quantity: string;
  averagePrice?: number;
  image?: string;
}

// External API base URL
const EXTERNAL_API_BASE_URL = process.env.NEXT_PUBLIC_CIJENE_API_URL + "/v1";

// Create axios instance for external API
const cijeneApiClient: AxiosInstance = axios.create({
  baseURL: EXTERNAL_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include external API key if available
cijeneApiClient.interceptors.request.use((config) => {
  const externalApiKey = process.env.NEXT_PUBLIC_CIJENE_API_TOKEN;
  if (externalApiKey && config.headers) {
    config.headers.Authorization = `Bearer ${externalApiKey}`;
  }

  return config;
});

/**
 * Transform external product data to match ProductItem interface
 */
export const transformExternalProduct = (
  externalProduct: ExternalProduct
): ProductItem => {
  // Calculate average price from all chains
  const prices = externalProduct.chains
    .map((chain) => parseFloat(chain.avg_price))
    .filter((price) => !isNaN(price) && price > 0);

  const averagePrice =
    prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : undefined;

  // Format quantity nicely and trim trailing zeros
  const formatQuantity = (quantity: string | null): string => {
    if (!quantity) return "";

    // Trim trailing zeros and decimal point if needed
    return quantity.replace(/\.?0+$/, "").replace(/\.$/, "");
  };

  const quantity =
    externalProduct.quantity && externalProduct.unit
      ? `${formatQuantity(externalProduct.quantity)} ${externalProduct.unit}`
      : formatQuantity(externalProduct.quantity);

  return {
    id: externalProduct.ean,
    name: externalProduct.name,
    brand: externalProduct.brand || "Nepoznato",
    category: externalProduct.chains[0]?.category || "",
    quantity,
    averagePrice,
    image: undefined, // External API doesn't provide images
  };
};

/**
 * Get product details by EAN barcode
 */
export const getExternalProductByEan = async (
  params: GetExternalProductParams
): Promise<ExternalProduct> => {
  const { ean, date, chains } = params;

  const queryParams = new URLSearchParams();
  if (date) queryParams.append("date", date);
  if (chains) queryParams.append("chains", chains);

  const queryString = queryParams.toString();
  const url = `/products/${ean}/${queryString ? `?${queryString}` : ""}`;

  const response = await cijeneApiClient.get<ExternalProduct>(url);
  return response.data;
};

/**
 * Search products by name
 */
export const searchExternalProducts = async (
  params: SearchExternalProductsParams
): Promise<ExternalProduct[]> => {
  const { q, date, chains } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("q", q);
  if (date) queryParams.append("date", date);
  if (chains) queryParams.append("chains", chains);

  const response = await cijeneApiClient.get<SearchExternalProductsResponse>(
    `/products/?${queryParams.toString()}`
  );
  return response.data.products;
};

// React Query hooks
export const useGetExternalProductByEan = (
  params: GetExternalProductParams
) => {
  return useQuery<ExternalProduct, Error>({
    queryKey: ["externalProducts", "ean", params],
    queryFn: () => getExternalProductByEan(params),
    enabled: !!params.ean,
  });
};

export const useSearchExternalProducts = (
  params: SearchExternalProductsParams
) => {
  return useQuery<ExternalProduct[], Error>({
    queryKey: ["externalProducts", "search", params],
    queryFn: () => searchExternalProducts(params),
    enabled: !!params.q && params.q.length > 2,
  });
};

const externalProductService = {
  getExternalProductByEan,
  searchExternalProducts,
  transformExternalProduct,
  // React Query hooks
  useGetExternalProductByEan,
  useSearchExternalProducts,
};

export default externalProductService;
