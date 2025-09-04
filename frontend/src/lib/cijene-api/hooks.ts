import * as cijeneService from "./index";
import {
  ProductResponse,
  StorePrice,
  StoreResponse,
  ChainProductResponse,
} from "./schemas";
import { useMemo } from "react";
import { locationNamesMap } from "@/utils/mappings";
import { StoreLocation } from "@/typings/store-location";

interface ProductSearchParams {
  q: string;
  chains?: string;
}

/**
 * Hook that searches Cijene API
 */
export const useProductSearch = (params: ProductSearchParams) => {
  const { q, chains } = params;

  // Cijene API search
  const cijeneQuery = cijeneService.useSearchProducts({
    q,
    chains,
  });

  return {
    data: cijeneQuery.data?.products || [],
    isLoading: cijeneQuery.isLoading,
    error: cijeneQuery.error,
    refetch: cijeneQuery.refetch,
  };
};

/**
 * Hook for getting product recommendations based on search query
 */
export const useProductRecommendations = (query: string, limit = 5) => {
  const { data: products, isLoading } = useProductSearch({
    q: query,
  });

  // Get recommendations based on different criteria
  const recommendations = useMemo(() => {
    if (!products?.length) return [];

    // Sort by best value (price and availability)
    return products
      .filter((product: ProductResponse) => product.chains.length > 0)
      .sort((a: ProductResponse, b: ProductResponse) => {
        // Prefer products with multiple chain availability
        const aChains = a.chains.length;
        const bChains = b.chains.length;

        if (aChains !== bChains) {
          return bChains - aChains; // More chains = better
        }

        // Then by price
        const priceA = Math.min(
          ...a.chains.map((c: ChainProductResponse) => parseFloat(c.min_price))
        );
        const priceB = Math.min(
          ...b.chains.map((c: ChainProductResponse) => parseFloat(c.min_price))
        );

        return priceA - priceB;
      })
      .slice(0, limit);
  }, [products, limit]);

  return {
    recommendations,
    isLoading,
  };
};

/**
 * Hook for price comparison across chains for a specific EAN
 */
export const usePriceComparison = (ean: string) => {
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const pricesQuery = cijeneService.useGetPrices({ eans: ean });

  const comparison = useMemo(() => {
    if (!productQuery.data || !pricesQuery.data) return null;

    const product = productQuery.data;
    const prices = pricesQuery.data.store_prices;

    // Group prices by chain
    const chainPrices = prices.reduce(
      (acc: Record<string, StorePrice[]>, price: StorePrice) => {
        const chain = price.chain;
        if (!acc[chain]) {
          acc[chain] = [];
        }
        acc[chain].push(price);
        return acc;
      },
      {} as Record<string, StorePrice[]>
    );

    // Calculate statistics for each chain
    const chainStats = Object.entries(chainPrices).map(
      ([chain, prices]: [string, StorePrice[]]) => {
        const regularPrices = (prices as StorePrice[])
          .map((p: StorePrice) => parseFloat(p.regular_price || "0"))
          .filter((p: number) => p > 0);

        const specialPrices = (prices as StorePrice[])
          .map((p: StorePrice) => parseFloat(p.special_price || "0"))
          .filter((p: number) => p > 0);

        return {
          chain,
          storeCount: prices.length,
          regularPrice: {
            min: Math.min(...regularPrices),
            max: Math.max(...regularPrices),
            avg:
              regularPrices.reduce((a: number, b: number) => a + b, 0) /
              regularPrices.length,
          },
          specialPrice:
            specialPrices.length > 0
              ? {
                  min: Math.min(...specialPrices),
                  max: Math.max(...specialPrices),
                  avg:
                    specialPrices.reduce((a: number, b: number) => a + b, 0) /
                    specialPrices.length,
                }
              : null,
          bestPrice: Math.min(
            ...[...regularPrices, ...specialPrices].filter((p: number) => p > 0)
          ),
        };
      }
    );

    return {
      product,
      chainStats: chainStats.sort((a, b) => a.bestPrice - b.bestPrice),
      bestOverall: chainStats.reduce((best, current) =>
        current.bestPrice < best.bestPrice ? current : best
      ),
    };
  }, [productQuery.data, pricesQuery.data]);

  return {
    comparison,
    isLoading: productQuery.isLoading || pricesQuery.isLoading,
    error: productQuery.error || pricesQuery.error,
  };
};

/**
 * Hook for fetching all locations/cities from all chains for sidebar
 */
export const useAllLocations = () => {
  // Get all chains first
  const {
    data: chainsData,
    isLoading: chainsLoading,
    error: chainsError,
  } = cijeneService.useListChains();

  // Get all stores from all chains in one request
  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = cijeneService.useListAllStores();

  // Process and combine all store data
  const locations = useMemo<Array<StoreLocation>>(() => {
    if (
      chainsLoading ||
      storesLoading ||
      !chainsData?.chains ||
      !storesData?.stores
    ) {
      return [];
    }

    // Group stores by city and aggregate data
    const cityMap = new Map<
      string,
      {
        storeCount: number;
        chains: Set<string>;
      }
    >();

    storesData.stores.forEach((store: StoreResponse) => {
      if (!store.city) return; // Skip stores without city info

      const city = store.city.trim();
      if (!city) return;

      // Use locationNamesMap to get standardized location name, fallback to original
      const standardizedLocationName = locationNamesMap[city] || city;

      if (!cityMap.has(standardizedLocationName)) {
        cityMap.set(standardizedLocationName, {
          storeCount: 0,
          chains: new Set(),
        });
      }

      const cityData = cityMap.get(standardizedLocationName)!;
      cityData.storeCount++;
      cityData.chains.add(store.chain_code);
    });

    // Convert to array and sort
    return Array.from(cityMap.entries())
      .map(([standardizedLocationName, data]) => ({
        name: standardizedLocationName,
        storeCount: data.storeCount,
        chains: Array.from(data.chains).sort(),
      }))
      .sort((a, b) => b.storeCount - a.storeCount);
  }, [chainsData, storesData, chainsLoading, storesLoading]);

  return {
    data: locations,
    isLoading: chainsLoading || storesLoading,
    error: chainsError || storesError,
  };
};
