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

import { useQueries } from "@tanstack/react-query";
import { formatDate } from "@/utils/strings";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";

interface UsePriceHistoryArgs {
  ean: string;
  /** Number of days back INCLUDING today. Pass -1 for all available history, capped to not go earlier than 2025-05-16. */
  days?: number;
}

/**
 * Fetch product price snapshots for the last N days in parallel
 *
 * @param ean - Product EAN code
 * @param days - Number of days to fetch (default 7). Pass -1 for all available history, capped to not go earlier than 2025-05-16
 * @returns Object containing history data, chains, loading/error states
 */

const START_DATE = new Date("2025-05-16");

export function usePriceHistory({ ean, days = 7 }: UsePriceHistoryArgs) {
  const dates = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    const startCap = START_DATE;

    // Cap days to not go earlier than start date
    const maxDaysFromCap = Math.max(
      0,
      Math.ceil((today.getTime() - startCap.getTime()) / (1000 * 60 * 60 * 24))
    );

    let cappedDays: number;
    if (days === -1) {
      cappedDays = maxDaysFromCap;
    } else {
      cappedDays = Math.min(days, maxDaysFromCap);
    }

    for (let i = 0; i < cappedDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr.reverse(); // chronological
  }, [days]);

  const queries = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["cijene", "product", "history", ean, date],
      queryFn: () => cijeneService.getProductByEan({ ean, date }),
      enabled: !!ean,
      staleTime: 6 * 60 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const { data, chains } = useMemo(() => {
    // collect all chain codes seen across all days
    const chainSet = new Set<string>();

    const rows: HistoryDataPoint[] = dates
      .map((date, idx) => {
        const q = queries[idx];
        const product = q?.data as ProductResponse;

        if (product?.chains) {
          product.chains.forEach((c) => {
            chainSet.add(c.chain);
          });
        }

        return {
          date: formatDate(date),
          product: product || ({} as ProductResponse),
        };
      })
      .filter((item) => item.product && Object.keys(item.product).length > 0);

    return { data: rows, chains: Array.from(chainSet) };
  }, [queries, dates]);

  return { data, chains, isLoading, isError };
}
