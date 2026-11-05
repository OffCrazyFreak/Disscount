import { catalogEans } from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { ShoppingListDto } from "@/lib/api/types";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import { priceHistoryQueries } from "@/lib/cijene-api/price-history-queries";
import { useUser } from "@/context/user-context";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { usePriceHistoryChains } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-price-history-chains";
import {
  getPriceHistoryDates,
  groupPriceHistoriesByEan,
  getAvailableChains,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-series";
import {
  buildChartData,
  buildChartConfig,
} from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-chart-data";
import { calculateYAxisTicks } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-axis";
import { calculateTotalPriceChange } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-history-totals";

export function useShoppingListPriceHistory(
  shoppingList: ShoppingListDto,
  period: PeriodOption,
) {
  "use no memo";
  // The compiler caches `new Date()`, so a tab open past Zagreb midnight would keep yesterday without the opt-out.
  const today = zagrebClock(new Date()).date;
  const { accountUser } = useUser();

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  const eans = useMemo(
    () => catalogEans(shoppingList.items),
    [shoppingList.items],
  );

  const dates = useMemo(
    () => getPriceHistoryDates(daysToShow, today),
    [daysToShow, today],
  );

  const queries = useQueries({
    queries: eans.flatMap((ean) => priceHistoryQueries(ean, dates)),
  });

  const isLoading = queries.some((q) => q.isLoading);
  // Only a series with nothing cached is missing; a failed refetch keeps its last answer.
  const hasError = queries.some((q) => q.isError && q.data === undefined);
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
    () => accountUser?.pinnedStores?.map((store) => store.storeApiId) || [],
    [accountUser?.pinnedStores],
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
