import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ShoppingListDto } from "@/lib/api/types";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import cijeneService from "@/lib/cijene-api";
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

export function useShoppingListPriceHistory(
  shoppingList: ShoppingListDto,
  period: PeriodOption,
) {
  const { user } = useUser();

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  const eans = useMemo(() => {
    return shoppingList.items?.map((item) => item.ean) || [];
  }, [shoppingList.items]);

  const dates = useMemo(() => getPriceHistoryDates(daysToShow), [daysToShow]);

  const queries = useQueries({
    queries: eans.flatMap((ean) =>
      dates.map((date, index) => ({
        queryKey: ["cijene", "product", "history", ean, date],
        queryFn: () => cijeneService.getProductByEan({ ean, date }),
        enabled: !!ean,
        staleTime:
          index === 0 || index === dates.length - 1
            ? 60 * 1000
            : 6 * 60 * 60 * 1000,
      })),
    ),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.isError);
  const areChainsReady = queries.every((q) => q.isSuccess || q.isError);

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
