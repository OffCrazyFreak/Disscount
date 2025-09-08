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

/**
 * Hook for fetching all locations/cities from all chains for sidebar
 */
export function useAllLocations() {
  // Get all stores from all chains in one request
  const {
    data: storesData,
    isLoading: storesLoading,
    error: storesError,
  } = cijeneService.useSearchStores();

  // Process and combine all store data
  const locations = useMemo<Array<StoreLocation>>(() => {
    if (storesLoading || !storesData?.stores) {
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
  }, [storesData, storesLoading]);

  return {
    data: locations,
    isLoading: storesLoading,
    error: storesError,
  };
}
