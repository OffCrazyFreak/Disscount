"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  getPriceHistoryPreferences,
  setPriceHistoryPreferences,
} from "@/utils/browser/local-storage";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import PriceHistoryChart from "@/app/products/[id]/components/price-history/price-history-chart";
import PriceHistoryPeriodSelect from "@/components/custom/price-history-period-select";
import StoreChainMultiSelect from "@/components/custom/store-chain-multi-select";
import PriceChangeDisplay from "@/components/custom/price-change-display";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import {
  getAveragePrice,
  calculatePriceChange,
} from "@/app/products/utils/product-utils";

interface IPriceHistoryProps {
  product: ProductResponse;
}

export default function PriceHistory({ product }: IPriceHistoryProps) {
  const { user } = useUser();

  const [chartPrefs, setChartPrefs] = useState<{
    period: PeriodOption;
    chains: string[];
  }>(() => {
    const { productsPreferences } = getPriceHistoryPreferences(product.ean);
    const availableChains =
      product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [];

    // Get period from product-specific prefs or default
    const period = (productsPreferences?.period || "1W") as PeriodOption;

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
    return productsPreferences?.isPriceHistoryOpen ?? true;
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

  return (
    <Collapsible open={isPriceHistoryOpen} onOpenChange={setIsPriceHistoryOpen}>
      <CollapsibleTrigger asChild className="py-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Povijest cijena</h2>

          <Separator className="flex-1 my-2" />

          <div className="flex items-center gap-4">
            <p className="hidden sm:inline text-gray-700 text-sm">
              {isPriceHistoryOpen ? "Sakrij" : "Prikaži"}
            </p>

            <ChevronDown
              className={cn(
                "size-8 text-gray-500 transition-transform flex-shrink-0",
                isPriceHistoryOpen && "rotate-180",
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PriceHistoryPeriodSelect
                    value={chartPrefs.period}
                    onChange={handlePeriodChange}
                  />
                  <PriceChangeDisplay priceChange={priceChange} />
                </div>

                <StoreChainMultiSelect
                  chains={priceHistoryChains}
                  selectedChains={chartPrefs.chains}
                  onChainsChange={handleChainsChange}
                  className="w-full sm:w-sm"
                />
              </div>

              <TabsContent value={chartPrefs.period} className="mt-4">
                {historyLoading ? (
                  <div className="grid place-items-center">
                    <BlockLoadingSpinner />
                  </div>
                ) : priceHistoryData.length === 0 || historyError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Nema dostupnih povijesnih podataka.
                    </p>
                  </div>
                ) : (
                  <PriceHistoryChart
                    priceHistoryData={priceHistoryData}
                    priceHistoryChains={priceHistoryChains}
                    selectedChains={chartPrefs.chains}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
