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

interface PriceHistoryProps {
  ean: string;
  product: ProductResponse;
}

export default function PriceHistory({ ean, product }: PriceHistoryProps) {
  const [chartPrefs, setChartPrefs] = useState<{
    period: PeriodOption;
    chains: string[];
  }>(() => {
    const localStoragePrefs = getAppStorage()?.priceHistoryChartPreferences;
    if (localStoragePrefs) {
      return localStoragePrefs;
    }

    return {
      period: "1W",
      chains:
        product.chains?.map((c) => (typeof c === "string" ? c : c.chain)) || [],
    };
  });

  useEffect(() => {
    setAppStorage({ priceHistoryChartPreferences: chartPrefs });
  }, [chartPrefs]);

  // Calculate days to show based on selected period
  const daysToShow: number = useMemo(() => {
    return periodOptions[chartPrefs.period as PeriodOption]?.days || 7;
  }, [chartPrefs.period]);

  const {
    data: priceHistoryData,
    chains: priceHistoryChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({ ean, days: daysToShow });

  const handlePeriodChange = useCallback((period: string) => {
    setChartPrefs((p) => ({ ...p, period: period as PeriodOption }));
  }, []);

  const handleChainsChange = useCallback((chains: string[]) => {
    setChartPrefs((p) => (chains.length > 0 ? { ...p, chains } : p));
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
              onPeriodChange={handlePeriodChange}
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
              ) : priceHistoryData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Nema dostupnih podataka za grafikon.
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
