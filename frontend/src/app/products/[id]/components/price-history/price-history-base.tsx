"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getAppStorage, setAppStorage } from "@/lib/api/local-storage";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import PriceHistoryChart from "@/app/products/[id]/components/price-history/price-history-chart";
import PriceHistoryControls from "@/app/products/[id]/components/price-history/price-history-controls";
import { PeriodOption } from "@/app/products/[id]/typings/history-period-options";
import { periodOptions } from "@/app/products/[id]/utils/price-history-constants";

interface IPriceHistoryProps {
  product: ProductResponse;
}

export default function PriceHistory({ product }: IPriceHistoryProps) {
  const [chartPrefs, setChartPrefs] = useState<{
    period: PeriodOption;
    chains: string[];
  }>(() => {
    const globalPrefs = getAppStorage()?.priceHistoryChartPreferences;
    const productPrefs = globalPrefs?.[product.ean];
    const availableChains =
      product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [];

    // Get period from product-specific prefs or fall back to global period or default
    const period = productPrefs?.period || globalPrefs?.period || "1W";

    if (productPrefs?.chains) {
      // Sanitize persisted chains by intersecting with available chains
      const sanitizedChains = productPrefs.chains.filter((chain: string) =>
        availableChains.includes(chain)
      );

      return {
        period,
        chains: sanitizedChains.length > 0 ? sanitizedChains : availableChains,
      };
    }

    // If EAN isn't in preferences yet, default to all available chains
    return {
      period,
      chains: availableChains,
    };
  });

  useEffect(() => {
    // Load existing preferences
    const existingPrefs = getAppStorage()?.priceHistoryChartPreferences || {};

    // Merge in the current product's preferences
    const updatedPrefs = {
      ...existingPrefs,
      period: chartPrefs.period, // Store period globally
      [product.ean]: {
        period: chartPrefs.period,
        chains: chartPrefs.chains,
      },
    };

    setAppStorage({ priceHistoryChartPreferences: updatedPrefs });
  }, [chartPrefs, product.ean]);

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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Povijest cijena</h2>
      <Card>
        <CardContent>
          <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
            <PriceHistoryControls
              chartPrefs={chartPrefs}
              priceHistoryData={priceHistoryData}
              priceHistoryChains={priceHistoryChains}
              onChainsChange={handleChainsChange}
            />

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
      </Card>
    </div>
  );
}
