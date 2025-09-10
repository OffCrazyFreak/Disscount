"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import usePriceHistory from "@/app/products/[id]/hooks/use-price-history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { storeNamesMap } from "@/utils/mappings";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getAppStorage, setAppStorage } from "@/lib/api/local-storage";
import { formatDate } from "@/utils/strings";
import { useUser } from "@/context/user-context";

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
  const { user } = useUser();

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

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    allAvailableChains.forEach((chain) => {
      cfg[chain] = { label: storeNamesMap[chain] || chain };
    });
    return cfg;
  }, [allAvailableChains]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Povijest cijena</h2>
      <Card>
        <CardContent>
          <Tabs
            value={chartPrefs.period}
            onValueChange={(v) =>
              setChartPrefs((p) => ({ ...p, period: v as PeriodOption }))
            }
          >
            <div className="flex align-center justify-between mb-4">
              <TabsList className="">
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
                <TabsTrigger value="ALL">All</TabsTrigger>
              </TabsList>

              <MultiSelect
                values={chartPrefs.chains}
                onValuesChange={(chains) =>
                  setChartPrefs((p) =>
                    chains.length > 0 ? { ...p, chains } : p
                  )
                }
              >
                <MultiSelectTrigger className="w-xs">
                  <MultiSelectValue placeholder="Odaberi trgovinske lance..." />
                </MultiSelectTrigger>
                <MultiSelectContent>
                  <MultiSelectGroup>
                    {allAvailableChains.map((chainCode) => (
                      <MultiSelectItem key={chainCode} value={chainCode}>
                        {storeNamesMap[chainCode] || chainCode}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelect>
            </div>

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
                <ChartContainer config={chartConfig}>
                  <LineChart accessibilityLayer data={formattedChartData}>
                    <CartesianGrid vertical={true} />

                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        // Parse the formatted date to determine if we should show it
                        const dateParts = value.split(".");
                        if (dateParts.length === 4) {
                          // DD.MM.YYYY.
                          const day = parseInt(dateParts[0]);
                          const month = parseInt(dateParts[1]);

                          // Show fewer ticks for better readability
                          const frequency =
                            chartPrefs.period === "1W"
                              ? 1
                              : chartPrefs.period === "1M"
                              ? 3
                              : chartPrefs.period === "1Y"
                              ? 7
                              : 14;

                          // Show tick if it's the first day of the period or every Nth day
                          return day % frequency === 0
                            ? value.slice(0, -5) // remove year and dot
                            : "";
                        }
                        return value;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value.toFixed(2)} €`}
                      domain={([dataMin, dataMax]) => {
                        const padding = 0.05;
                        return [
                          dataMin * (1 - padding),
                          dataMax * (1 + padding),
                        ];
                      }}
                    />

                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />

                    {chainsToDisplay.map((chainCode, index) => {
                      // Check if this chain is pinned by the user
                      const pinnedStoreIds =
                        user?.pinnedStores?.map((store) => store.storeApiId) ||
                        [];
                      const isPinned = pinnedStoreIds.includes(chainCode);

                      return (
                        <Line
                          key={chainCode}
                          dataKey={chainCode}
                          type="bump"
                          stroke={`var(--chart-${(index % 5) + 1})`}
                          strokeWidth={isPinned ? 2 : 0.3}
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ChartContainer>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
