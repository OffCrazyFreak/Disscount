"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { useUser } from "@/context/user-context";
import {
  getPriceHistoryPreferences,
  setPriceHistoryPreferences,
} from "@/lib/api/local-storage";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import PriceHistoryChart from "@/app/products/[id]/components/price-history/price-history-chart";
import PriceHistoryPeriodSelect from "@/components/custom/price-history-period-select";
import StoreChainMultiSelect from "@/components/custom/store-chain-multi-select";
import PriceChangeDisplay from "@/components/custom/price-change-display";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/app/products/[id]/utils/price-history-constants";
import {
  getAveragePrice,
  calculatePriceChange,
} from "@/lib/cijene-api/utils/product-utils";

interface IPriceHistoryProps {
  product: ProductResponse;
}

export default function PriceHistory({ product }: IPriceHistoryProps) {
  const { user } = useUser();

  const [chartPrefs, setChartPrefs] = useState<{
    period: PeriodOption;
    chains: string[];
  }>(() => {
    const { productPreferences } = getPriceHistoryPreferences(product.ean);
    const availableChains =
      product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [];

    // Get period from product-specific prefs or default
    const period = (productPreferences?.period || "1W") as PeriodOption;

    if (productPreferences?.chains) {
      // Sanitize persisted chains by intersecting with available chains
      const sanitizedChains = Array.from(
        new Set(productPreferences.chains)
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
      preferredStoreIds.includes(chain)
    );

    // If there are preferred stores, select only those; otherwise select all
    return {
      period,
      chains: preferredChains.length > 0 ? preferredChains : availableChains,
    };
  });

  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(() => {
    const { productPreferences } = getPriceHistoryPreferences(product.ean);
    return productPreferences?.isPriceHistoryOpen ?? true;
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
      priceHistoryData[priceHistoryData.length - 1].product
    );
    const historicalAvgPrice = getAveragePrice(priceHistoryData[0].product);

    if (currentAvgPrice == null || historicalAvgPrice == null) {
      return null;
    }

    return calculatePriceChange(currentAvgPrice, historicalAvgPrice);
  }, [priceHistoryData]);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <Collapsible
        open={isPriceHistoryOpen}
        onOpenChange={setIsPriceHistoryOpen}
      >
        <CollapsibleTrigger asChild className="cursor-pointer">
          <CardHeader className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">Povijest cijena</h3>

            <div className="flex-1 flex items-center justify-end gap-4">
              <p className="hidden sm:inline text-gray-700 text-sm text-pretty text-right">
                {isPriceHistoryOpen ? "Sakrij" : "Prikaži"}
              </p>
              <ChevronDown
                className={cn(
                  "size-8 text-gray-500 transition-transform flex-shrink-0",
                  isPriceHistoryOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
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
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-6 animate-spin" />
                      Učitavanje povijesti cijena...
                    </div>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
