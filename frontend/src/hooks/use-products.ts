import { useQuery } from "@tanstack/react-query";
import { productApi, type ProductSearchResponse } from "@/lib/api-client";

// Product search hook with React Query
export function useProductSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => productApi.searchProducts(query),
    enabled: enabled && !!query?.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook for getting product by barcode
export function useProductByBarcode(barcode: string, enabled = true) {
  return useQuery({
    queryKey: ["products", "barcode", barcode],
    queryFn: () => productApi.searchByBarcode(barcode),
    enabled: enabled && !!barcode?.trim(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// You can add more hooks here for different product-related queries
// For example:
// - useProductCategories
// - usePopularProducts
// - useProductDetails
