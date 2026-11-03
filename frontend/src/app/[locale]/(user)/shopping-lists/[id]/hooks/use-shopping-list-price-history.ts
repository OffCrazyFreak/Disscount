import { catalogEans } from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { ShoppingListDto } from "@/lib/api/types";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import { priceHistoryQueries } from "@/lib/cijene-api/price-history-queries";
import { useUser } from "@/context/user-context";
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
  /** Off until the chart is near the screen; see useNearViewport. */
  isEnabled: boolean,
) {
  const { user } = useUser();
  const locale = useLocale();

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  const eans = useMemo(
    () => catalogEans(shoppingList.items),
    [shoppingList.items],
  );

  const dates = useMemo(() => getPriceHistoryDates(daysToShow), [daysToShow]);

  const queries = useQueries({
    queries: eans.flatMap((ean) => priceHistoryQueries(ean, dates, isEnabled)),
  });

  // A query waiting to be enabled is not loading, but the chart still has nothing to show.
  const isLoading = !isEnabled || queries.some((q) => q.isLoading);
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
    () =>
      buildChartData(priceHistoriesByEan, eans, dates, selectedChains, locale),
    [priceHistoriesByEan, eans, dates, selectedChains, locale],
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
