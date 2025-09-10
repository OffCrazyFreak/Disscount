"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getAppStorage, setAppStorage } from "@/lib/api/local-storage";
import { formatDate } from "@/utils/strings";
import { storeNamesMap } from "@/utils/mappings";
import usePriceHistory from "@/app/products/[id]/hooks/use-price-history";
import PriceHistoryChart from "@/app/products/[id]/components/price-history/price-history-chart";
import PriceHistoryControls from "@/app/products/[id]/components/price-history/price-history-controls";

interface PriceHistoryProps {
  ean: string;
  product: ProductResponse;
}

type PeriodOption = "1W" | "1M" | "1Y" | "ALL";

const periodOptions: Record<PeriodOption, { days: number; title: string }> = {
  "1W": { days: 7, title: "(posljednjih 7 dana)" },
  "1M": { days: 30, title: "(posljednjih 30 dana)" },
  "1Y": { days: 365, title: "(posljednjih 365 dana)" },
  ALL: { days: -1, title: "(od početka)" },
};

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
      chains: product.chains.map((c) => (typeof c === "string" ? c : c.chain)),
    };
  });

  useEffect(() => {
    setAppStorage({ priceHistoryChartPreferences: chartPrefs });
  }, [chartPrefs]);

  // Calculate days to show based on selected period
  const daysToShow: number = useMemo(() => {
    return periodOptions[chartPrefs.period as PeriodOption]?.days;
  }, [chartPrefs.period]);

  const {
    data: chartData,
    chains: historyChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({ ean, days: daysToShow });

  const formattedChartData = useMemo(() => {
    const arr = (chartData ?? []).map((row) => ({
      ...row,
      date: formatDate(String(row.date)),
    }));
    return arr;
  }, [chartData]);

  const allAvailableChains = useMemo(() => {
    const chains = product?.chains || historyChains || [];
    return chains
      .slice()
      .map((c) => (typeof c === "string" ? c : c.chain))
      .sort((a: string, b: string) => {
        const nameA = storeNamesMap[a] || a;
        const nameB = storeNamesMap[b] || b;
        return nameA.localeCompare(nameB, "hr", {
          sensitivity: "base",
        });
      });
  }, [product?.chains, historyChains]);

  const chainsToDisplay = useMemo(() => {
    return allAvailableChains.filter((chain) =>
      chartPrefs.chains.includes(chain)
    );
  }, [allAvailableChains, chartPrefs.chains]);

  const handlePeriodChange = (period: string) => {
    setChartPrefs((p) => ({ ...p, period: period as PeriodOption }));
  };

  const handleChainsChange = (chains: string[]) => {
    setChartPrefs((p) => (chains.length > 0 ? { ...p, chains } : p));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Povijest cijena</h2>
      <Card>
        <CardContent>
          <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
            <PriceHistoryControls
              chartPrefs={chartPrefs}
              allAvailableChains={allAvailableChains}
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
              ) : formattedChartData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Nema dostupnih podataka za grafikon.
                  </p>
                </div>
              ) : (
                <PriceHistoryChart
                  formattedChartData={formattedChartData}
                  allAvailableChains={allAvailableChains}
                  chainsToDisplay={chainsToDisplay}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
