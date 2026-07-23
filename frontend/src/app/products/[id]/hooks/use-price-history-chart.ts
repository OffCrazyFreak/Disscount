import { useEffect, useState, useMemo, useCallback } from "react";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  getPriceHistoryPreferences,
  setPriceHistoryPreferences,
} from "@/utils/browser/local-storage";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions, getEnabledPeriod } from "@/constants/price-history";
import {
  getAveragePrice,
  calculatePriceChange,
} from "@/app/products/utils/product-utils";

interface IChartPrefs {
  period: PeriodOption;
  chains: string[];
}

export function usePriceHistoryChart(product: ProductResponse) {
  const { user } = useUser();

  const [chartPrefs, setChartPrefs] = useState<IChartPrefs>(() => {
    const { productsPreferences } = getPriceHistoryPreferences(product.ean);
    const availableChains =
      product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [];

    // A persisted period may since have been disabled, so coerce it back.
    const period = getEnabledPeriod(
      (productsPreferences?.period || "1W") as PeriodOption,
    );

    if (productsPreferences?.chains) {
      // Sanitize persisted chains by intersecting with available chains
      const sanitizedChains = Array.from(
        new Set(productsPreferences.chains),
      ).filter((chain) => availableChains.includes(chain));

      return {
        period,
        chains: sanitizedChains.length > 0 ? sanitizedChains : availableChains,
      };
    }

    // If EAN isn't in preferences yet, default to preferred stores only (if any exist)
    const preferredStoreIds =
      user?.pinnedStores?.map((s) => s.storeApiId) || [];
    const preferredChains = availableChains.filter((chain) =>
      preferredStoreIds.includes(chain),
    );

    // If there are preferred stores, select only those; otherwise select all
    return {
      period,
      chains: preferredChains.length > 0 ? preferredChains : availableChains,
    };
  });

  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(() => {
    const { productsPreferences } = getPriceHistoryPreferences(product.ean);
    return productsPreferences?.isPriceHistoryOpen ?? false;
  });

  // Persist product-specific preferences whenever period, chains, or isOpen change
  useEffect(() => {
    setPriceHistoryPreferences(product.ean, {
      period: chartPrefs.period,
      chains: chartPrefs.chains,
      isPriceHistoryOpen: isPriceHistoryOpen,
    });
  }, [chartPrefs.period, chartPrefs.chains, isPriceHistoryOpen, product.ean]);

  // Calculate days to show based on selected period
  const daysToShow: number = useMemo(() => {
    return periodOptions[chartPrefs.period as PeriodOption]?.days || 7;
  }, [chartPrefs.period]);

  const {
    data: priceHistoryData,
    chains: priceHistoryChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({ ean: product.ean, days: daysToShow });

  const handlePeriodChange = useCallback((period: string) => {
    setChartPrefs((p) => ({ ...p, period: period as PeriodOption }));
  }, []);

  const handleChainsChange = useCallback((chains: string[]) => {
    // Ensure at least one chain is always selected
    if (chains.length > 0) {
      setChartPrefs((p) => ({ ...p, chains }));
    }
    // If no chains are selected, keep the current selection unchanged
  }, []);

  // Calculate price change
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
    isPriceHistoryOpen,
    setIsPriceHistoryOpen,
    priceHistoryData,
    priceHistoryChains,
    historyLoading,
    historyError,
    handlePeriodChange,
    handleChainsChange,
    priceChange,
  };
}
