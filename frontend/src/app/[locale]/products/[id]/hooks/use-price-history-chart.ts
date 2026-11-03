import { useMemo } from "react";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  updateProductPreferences,
  useProductPreferences,
} from "@/app/[locale]/products/[id]/hooks/use-product-preferences";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions, getEnabledPeriod } from "@/constants/price-history";
import {
  getAveragePrice,
  calculatePriceChange,
} from "@/app/[locale]/products/utils/product-utils";

interface IChartPrefs {
  period: PeriodOption;
  chains: string[];
}

export function usePriceHistoryChart(
  product: ProductResponse,
  isEnabled: boolean,
) {
  const { user } = useUser();
  // Read through the store, not lazily: the open section is in the server HTML, which has only defaults.
  const saved = useProductPreferences(product.ean);

  const availableChains =
    product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [];

  // If EAN isn't in preferences yet, default to preferred stores only (if any exist)
  const preferredStoreIds = user?.pinnedStores?.map((s) => s.storeApiId) || [];
  const preferredChains = availableChains.filter((chain) =>
    preferredStoreIds.includes(chain),
  );

  // Sanitize persisted chains by intersecting with available chains
  const savedChains = saved.chains
    ? Array.from(new Set(saved.chains)).filter((chain) =>
        availableChains.includes(chain),
      )
    : null;

  const chartPrefs: IChartPrefs = {
    // A persisted period may since have been disabled, so coerce it back.
    period: getEnabledPeriod((saved.period || "1W") as PeriodOption),
    chains: savedChains
      ? savedChains.length > 0
        ? savedChains
        : availableChains
      : preferredChains.length > 0
        ? preferredChains
        : availableChains,
  };

  // Saved on change, not in an effect: one during hydration would overwrite the saved state.
  function savePreferences(prefs: IChartPrefs) {
    updateProductPreferences(product.ean, {
      period: prefs.period,
      chains: prefs.chains,
    });
  }

  const daysToShow: number = useMemo(() => {
    return periodOptions[chartPrefs.period as PeriodOption]?.days || 7;
  }, [chartPrefs.period]);

  const {
    data: priceHistoryData,
    chains: priceHistoryChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({
    ean: product.ean,
    days: daysToShow,
    enabled: isEnabled,
  });

  function handlePeriodChange(period: string) {
    savePreferences({
      ...chartPrefs,
      period: getEnabledPeriod(period as PeriodOption),
    });
  }

  function handleChainsChange(chains: string[]) {
    // Ensure at least one chain is always selected
    if (chains.length > 0) savePreferences({ ...chartPrefs, chains });
    // If no chains are selected, keep the current selection unchanged
  }

  const priceChange = useMemo(() => {
    if (priceHistoryData.length === 0) {
      return null;
    }

    const currentAvgPrice = getAveragePrice(
      priceHistoryData[priceHistoryData.length - 1].product,
    );
    const historicalAvgPrice = getAveragePrice(priceHistoryData[0].product);

    if (currentAvgPrice == null || historicalAvgPrice == null) {
      return null;
    }

    return calculatePriceChange(currentAvgPrice, historicalAvgPrice);
  }, [priceHistoryData]);

  return {
    chartPrefs,
    priceHistoryData,
    priceHistoryChains,
    historyLoading,
    historyError,
    handlePeriodChange,
    handleChainsChange,
    priceChange,
  };
}
