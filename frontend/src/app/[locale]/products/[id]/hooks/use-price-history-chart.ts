import { useState, useMemo } from "react";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import { getPriceHistoryPreferences } from "@/utils/browser/local-storage";
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

export function usePriceHistoryChart(product: ProductResponse) {
  const { user } = useUser();
  const { isPriceHistoryOpen = false } = useProductPreferences(product.ean);

  // Safe to read lazily: only the closed-by-default panel shows these, so no server HTML does.
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

  // Saved on change, not in an effect: one during hydration would overwrite the saved open
  // state with the server default.
  function savePreferences(prefs: IChartPrefs, isOpen: boolean) {
    updateProductPreferences(product.ean, {
      period: prefs.period,
      chains: prefs.chains,
      isPriceHistoryOpen: isOpen,
    });
  }

  function setIsPriceHistoryOpen(isOpen: boolean) {
    savePreferences(chartPrefs, isOpen);
  }

  const daysToShow: number = useMemo(() => {
    return periodOptions[chartPrefs.period as PeriodOption]?.days || 7;
  }, [chartPrefs.period]);

  const {
    data: priceHistoryData,
    chains: priceHistoryChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({ ean: product.ean, days: daysToShow });

  function handlePeriodChange(period: string) {
    const next = {
      ...chartPrefs,
      period: getEnabledPeriod(period as PeriodOption),
    };
    setChartPrefs(next);
    savePreferences(next, isPriceHistoryOpen);
  }

  function handleChainsChange(chains: string[]) {
    // Ensure at least one chain is always selected
    if (chains.length > 0) {
      const next = { ...chartPrefs, chains };
      setChartPrefs(next);
      savePreferences(next, isPriceHistoryOpen);
    }
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
