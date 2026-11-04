import * as cijeneService from "@/lib/cijene-api/index";
import { ProductResponse, StoreResponse } from "@/lib/cijene-api/schemas";
import { useMemo } from "react";
import { getLocationLabel } from "@/utils/labels";
import { IStoreLocation } from "@/typings/store-location";

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
  const locations = useMemo<Array<IStoreLocation>>(() => {
    if (storesLoading || !storesData?.stores) {
      return [];
    }

    // Group stores by city and aggregate data
    const cityMap = new Map<
      string,
      {
        storeCount: number;
        chains: Set<string>;
        sourceCities: Set<string>;
      }
    >();

    storesData.stores.forEach((store: StoreResponse) => {
      if (!store.city) return; // Skip stores without city info

      const city = store.city.trim();
      if (!city) return;

      const standardizedLocationName = getLocationLabel(city);

      if (!cityMap.has(standardizedLocationName)) {
        cityMap.set(standardizedLocationName, {
          storeCount: 0,
          chains: new Set(),
          sourceCities: new Set(),
        });
      }

      const cityData = cityMap.get(standardizedLocationName)!;
      cityData.storeCount++;
      cityData.chains.add(store.chain_code);
      cityData.sourceCities.add(city);
    });

    return Array.from(cityMap.entries())
      .map(([standardizedLocationName, data]) => ({
        name: standardizedLocationName,
        storeCount: data.storeCount,
        chains: Array.from(data.chains).sort(),
        sourceCities: Array.from(data.sourceCities).sort(),
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
import { HistoryDataPoint } from "@/lib/cijene-api/history-data-point";
import type { IUsePriceHistoryArgs } from "@/lib/cijene-api/hooks-types";
import { buildDateWindow } from "@/utils/date";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { PRICE_ARCHIVE_START } from "@/constants/price-history";
import { priceHistoryQueries } from "@/lib/cijene-api/price-history-queries";

/**
 * Fetch product price snapshots for the last N days in parallel
 *
 * @param ean - Product EAN code
 * @param days - Number of days to fetch (default 7). Pass -1 for all available history, capped to not go earlier than 2025-05-16
 * @returns Object containing history data, chains, loading/error states
 */

export function usePriceHistory({ ean, days = 7 }: IUsePriceHistoryArgs) {
  "use no memo";
  // The compiler caches `new Date()` as a constant, so a tab left open past Zagreb midnight
  // would keep yesterday as its last day; reading the clock each render needs the opt-out.
  const today = zagrebClock(new Date()).date;
  const dates = useMemo(
    () => buildDateWindow(days, PRICE_ARCHIVE_START, today),
    [days, today],
  );

  const queries = useQueries({
    queries: priceHistoryQueries(ean, dates),
  });

  const isLoading = queries.some((q) => q.isLoading);
  // Only a day with nothing cached is missing; a failed refetch keeps its last answer.
  const isError = queries.some((q) => q.isError && q.data === undefined);

  const { data, chains } = useMemo(() => {
    // collect all chain codes seen across all days
    const chainSet = new Set<string>();

    const rows: HistoryDataPoint[] = dates.flatMap((date, idx) => {
      const product = queries[idx]?.data as ProductResponse | undefined;

      if (product?.chains) {
        product.chains.forEach((c) => {
          chainSet.add(c.chain);
        });
      }

      return product ? [{ date, product }] : [];
    });

    return { data: rows, chains: Array.from(chainSet) };
  }, [queries, dates]);

  return { data, chains, isLoading, isError };
}
