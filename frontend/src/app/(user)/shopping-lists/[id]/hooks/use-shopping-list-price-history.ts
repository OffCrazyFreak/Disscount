import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { ShoppingListDto } from "@/lib/api/types";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { CACHE_TIMES } from "@/lib/query/cache-times";
import { useDataPending } from "@/lib/query/use-data-pending";
import { useSettledOnce } from "@/lib/query/use-settled-once";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import cijeneService, { CIJENE_QUERY_KEYS } from "@/lib/cijene-api";
import { useUser } from "@/context/user-context";
import { usePriceHistoryChains } from "@/app/(user)/shopping-lists/[id]/hooks/use-price-history-chains";
import {
  getPriceHistoryDates,
  groupPriceHistoriesByEan,
  getAvailableChains,
} from "@/app/(user)/shopping-lists/[id]/utils/price-history-series";
import {
  buildChartData,
  buildChartConfig,
} from "@/app/(user)/shopping-lists/[id]/utils/price-history-chart-data";
import { calculateYAxisTicks } from "@/app/(user)/shopping-lists/[id]/utils/price-history-axis";
import { calculateTotalPriceChange } from "@/app/(user)/shopping-lists/[id]/utils/price-history-totals";

interface ICombinedHistoryQueries {
  results: UseQueryResult<ProductResponse, Error>[];
  isPending: boolean;
  isError: boolean;
  areChainsReady: boolean;
}

// Module scope so TanStack can memoise it. This fan-out is EANs x days, so a ten-item
// list on the default period is seventy results; rebuilding that array every render
// re-ran the whole chart pipeline below it.
function combineHistoryQueries(
  results: UseQueryResult<ProductResponse, Error>[],
): ICombinedHistoryQueries {
  return {
    results,
    isPending: results.some((result) => result.isPending),
    isError: results.some((result) => result.isError),
    areChainsReady: results.every(
      (result) => result.isSuccess || result.isError,
    ),
  };
}

/**
 * @param enabled false until the rest of the page has settled. This is the app's widest
 *   fan-out, one request per EAN per day, so ungated it starves everything around it.
 */
export function useShoppingListPriceHistory(
  shoppingList: ShoppingListDto,
  period: PeriodOption,
  enabled = true,
) {
  const { user } = useUser();

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  const eans = useMemo(() => {
    return shoppingList.items?.map((item) => item.ean) || [];
  }, [shoppingList.items]);

  const dates = useMemo(() => getPriceHistoryDates(daysToShow), [daysToShow]);

  // Latched, so adding an item cannot reclose the gate and blank a chart already on
  // screen while the new item's current price is fetched.
  const gate = useSettledOnce(enabled);

  const combined = useQueries({
    queries: eans.flatMap((ean) =>
      dates.map((date, index) => ({
        queryKey: CIJENE_QUERY_KEYS.productHistory(ean, date),
        queryFn: () => cijeneService.getProductByEan({ ean, date }),
        enabled: gate && !!ean,
        // Only the window's edges can still be revised upstream.
        staleTime:
          index === 0 || index === dates.length - 1
            ? CACHE_TIMES.priceHistoryEdge
            : CACHE_TIMES.priceHistoryArchived,
      })),
    ),
    combine: combineHistoryQueries,
  });
  const queries = combined.results;

  // isPending, not isLoading, and the gate folded in: a disabled query reports isFetching
  // false, so isLoading would read false with no data and the panel would show its "no
  // history" message instead of a skeleton while it waits its turn.
  const isLoading = useDataPending(!gate || combined.isPending);
  const hasError = combined.isError;
  const areChainsReady = combined.areChainsReady;

  const priceHistoriesByEan = useMemo(() => {
    return groupPriceHistoriesByEan(
      queries.map((q) => q.data),
      eans,
      dates.length,
    );
  }, [queries, eans, dates.length]);

  const availableChains = useMemo(
    () => getAvailableChains(priceHistoriesByEan),
    [priceHistoriesByEan],
  );

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) || [],
    [user?.pinnedStores],
  );

  const { selectedChains, handleChainsChange } = usePriceHistoryChains(
    shoppingList.id,
    availableChains,
    pinnedStoreIds,
    areChainsReady,
  );

  const chartData = useMemo(
    () => buildChartData(priceHistoriesByEan, eans, dates, selectedChains),
    [priceHistoriesByEan, eans, dates, selectedChains],
  );

  const chartConfig = useMemo(
    () => buildChartConfig(shoppingList.items),
    [shoppingList.items],
  );

  const yAxisTicks = useMemo(() => calculateYAxisTicks(chartData), [chartData]);

  const priceChange = useMemo(
    () => calculateTotalPriceChange(chartData, eans),
    [chartData, eans],
  );

  return {
    eans,
    availableChains,
    selectedChains,
    handleChainsChange,
    chartData,
    chartConfig,
    yAxisTicks,
    isLoading,
    hasError,
    priceChange,
  };
}
