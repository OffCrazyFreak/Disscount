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
  // isPending, not isLoading: PersistQueryClientProvider parks queries at an
  // idle fetchStatus while restoring, and isLoading reads false there, which
  // would report "locations ready" with none loaded and filter every product out.
  const {
    data: storesData,
    isPending: storesLoading,
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

    // Convert to array and sort
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

import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { formatDate } from "@/utils/strings";
import { useDataPending } from "@/lib/query/use-data-pending";
import { useSettledOnce } from "@/lib/query/use-settled-once";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";
import type { IUsePriceHistoryArgs } from "@/lib/cijene-api/hooks-types";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import { CACHE_TIMES } from "@/lib/query/cache-times";
import { buildDateWindow } from "@/utils/date";
import { PRICE_ARCHIVE_START } from "@/constants/price-history";

interface ICombinedHistoryQueries {
  results: UseQueryResult<ProductResponse, Error>[];
  isPending: boolean;
  isError: boolean;
}

// Module scope so TanStack can memoise the combined result. One request per day means
// this array is long, and rebuilding it every render re-ran every downstream useMemo.
function combineHistoryQueries(
  results: UseQueryResult<ProductResponse, Error>[],
): ICombinedHistoryQueries {
  return {
    results,
    isPending: results.some((result) => result.isPending),
    isError: results.some((result) => result.isError),
  };
}

/**
 * Fetch product price snapshots for the last N days in parallel
 *
 * @param ean - Product EAN code
 * @param days - Number of days to fetch (default 7). Pass -1 for all available history, capped to not go earlier than 2025-05-16
 * @returns Object containing history data, chains, loading/error states
 */

export function usePriceHistory({
  ean,
  days = 7,
  enabled = true,
}: IUsePriceHistoryArgs) {
  const dates = useMemo(
    () => buildDateWindow(days, PRICE_ARCHIVE_START),
    [days],
  );

  // Latched, so a background refetch of the page's own data cannot close the gate again
  // and blank a chart that is already on screen.
  const gate = useSettledOnce(enabled);

  const combined = useQueries({
    queries: dates.map((date, index) => ({
      queryKey: CIJENE_QUERY_KEYS.productHistory(ean, date),
      queryFn: () => cijeneService.getProductByEan({ ean, date }),
      enabled: gate && !!ean,
      // Only the window's edges can still be revised upstream.
      staleTime:
        index === 0 || index === dates.length - 1
          ? CACHE_TIMES.priceHistoryEdge
          : CACHE_TIMES.priceHistoryArchived,
    })),
    combine: combineHistoryQueries,
  });
  const queries = combined.results;

  // isPending, not isLoading, and the gate folded in: a disabled query reports isFetching
  // false, so isLoading would read false with no data and the panel would render its
  // "no history" branch instead of a skeleton while it waits its turn.
  const isLoading = useDataPending(!gate || combined.isPending);
  const isError = combined.isError;

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

      return product ? [{ date: formatDate(date), product }] : [];
    });

    return { data: rows, chains: Array.from(chainSet) };
  }, [queries, dates]);

  return { data, chains, isLoading, isError };
}
