"use client";

import React, { useMemo, useState, useCallback } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import StoreChainMultiSelect from "@/components/custom/store-chain-multi-select";
import PriceHistoryPeriodSelect from "@/components/custom/price-history-period-select";
import PriceChangeDisplay from "@/components/custom/price-change-display";
import { Loader2, ChevronDown } from "lucide-react";
import { ShoppingListDto } from "@/lib/api/types";
import { usePriceHistory } from "@/lib/cijene-api/hooks";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/app/products/[id]/utils/price-history-constants";
import { storeNamesMap } from "@/utils/mappings";
import { useUser } from "@/context/user-context";
import { calculatePriceChange } from "@/lib/cijene-api/utils/product-utils";
import { Separator } from "@/components/ui/separator";

interface ShoppingListPriceHistoryProps {
  shoppingList: ShoppingListDto;
}

interface ChartDataPoint {
  date: string;
  [ean: string]: string | number;
}

export default function ShoppingListPriceHistory({
  shoppingList,
}: ShoppingListPriceHistoryProps) {
  const { user } = useUser();
  const [period, setPeriod] = useState<PeriodOption>("1W");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  // Get all EANs from shopping list items
  const eans = useMemo(() => {
    return shoppingList.items?.map((item) => item.ean) || [];
  }, [shoppingList.items]);

  // Fetch price history for all products
  const priceHistories = eans.map((ean) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePriceHistory({ ean, days: daysToShow })
  );

  const isLoading = priceHistories.some((ph) => ph.isLoading);
  const hasError = priceHistories.some((ph) => ph.isError);

  // Get all available chains from the price histories
  const availableChains = useMemo(() => {
    const chainSet = new Set<string>();
    priceHistories.forEach((ph) => {
      ph.chains.forEach((chain) => chainSet.add(chain));
    });
    return Array.from(chainSet);
  }, [priceHistories]);

  // Initialize selected chains with preferred stores or all chains
  React.useEffect(() => {
    if (availableChains.length > 0 && selectedChains.length === 0) {
      const preferredStoreIds =
        user?.pinnedStores?.map((s) => s.storeApiId) || [];
      const preferredChains = availableChains.filter((chain) =>
        preferredStoreIds.includes(chain)
      );

      setSelectedChains(
        preferredChains.length > 0 ? preferredChains : availableChains
      );
    }
  }, [availableChains, selectedChains.length, user?.pinnedStores]);

  // Transform data: calculate average price per product per day
  const chartData = useMemo(() => {
    if (priceHistories.length === 0 || priceHistories[0].data.length === 0) {
      return [];
    }

    const dateMap = new Map<string, ChartDataPoint>();

    priceHistories.forEach((priceHistory, index) => {
      const ean = eans[index];
      const item = shoppingList.items?.find((i) => i.ean === ean);

      priceHistory.data.forEach((dataPoint) => {
        const date = dataPoint.date;

        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }

        const chartPoint = dateMap.get(date)!;

        // Calculate average price across selected chains only
        if (dataPoint.product?.chains && dataPoint.product.chains.length > 0) {
          const prices: number[] = [];

          dataPoint.product.chains.forEach((chainData) => {
            // Only include prices from selected chains
            if (selectedChains.includes(chainData.chain)) {
              const avgPrice = parseFloat(chainData.avg_price);
              if (Number.isFinite(avgPrice)) {
                prices.push(avgPrice);
              }
            }
          });

          if (prices.length > 0) {
            const averagePrice =
              prices.reduce((sum, p) => sum + p, 0) / prices.length;
            chartPoint[ean] = parseFloat(averagePrice.toFixed(2));
          }
        }
      });
    });

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [priceHistories, eans, shoppingList.items, selectedChains]);

  // Create chart config with product names
  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    shoppingList.items?.forEach((item) => {
      const label = item.brand ? `${item.brand} ${item.name}` : item.name;
      cfg[item.ean] = { label };
    });
    return cfg;
  }, [shoppingList.items]);

  // Calculate Y-axis ticks
  const yAxisTicks = useMemo(() => {
    const padding = 0.05;

    if (chartData.length === 0) return [];

    const allPrices = chartData.flatMap((d) =>
      Object.entries(d)
        .filter(([k]) => k !== "date")
        .map(([_, v]) => (typeof v === "number" ? v : 0))
    );

    if (allPrices.length === 0) return [];

    const paddedMin = Math.min(...allPrices) * (1 - padding);
    const paddedMax = Math.max(...allPrices) * (1 + padding);

    const ticks = [];
    const step = 1;
    const start = Math.floor(paddedMin / step) * step;
    const end = Math.ceil(paddedMax / step) * step;

    for (let i = start; i <= end; i += step) {
      ticks.push(parseFloat(i.toFixed(2)));
    }
    return ticks;
  }, [chartData]);

  const handlePeriodChange = useCallback((value: string) => {
    setPeriod(value as PeriodOption);
  }, []);

  const handleChainsChange = useCallback((chains: string[]) => {
    if (chains.length > 0) {
      setSelectedChains(chains);
    }
  }, []);

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) || [],
    [user?.pinnedStores]
  );

  // Calculate total price change for all items in the shopping list
  const priceChange = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    // Get first and last data points
    const historicalData = chartData[0];
    const currentData = chartData[chartData.length - 1];

    // Calculate total price for each time point (sum of all products)
    let historicalTotal = 0;
    let currentTotal = 0;
    let historicalCount = 0;
    let currentCount = 0;

    eans.forEach((ean) => {
      const historicalPrice = historicalData[ean];
      const currentPrice = currentData[ean];

      if (
        typeof historicalPrice === "number" &&
        Number.isFinite(historicalPrice)
      ) {
        historicalTotal += historicalPrice;
        historicalCount++;
      }

      if (typeof currentPrice === "number" && Number.isFinite(currentPrice)) {
        currentTotal += currentPrice;
        currentCount++;
      }
    });

    // Only calculate if we have prices for both time points
    if (historicalCount === 0 || currentCount === 0) {
      return null;
    }

    return calculatePriceChange(currentTotal, historicalTotal);
  }, [chartData, eans]);

  if (!shoppingList.items || shoppingList.items.length === 0) {
    return null;
  }

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
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PriceHistoryPeriodSelect
                    value={period}
                    onChange={handlePeriodChange}
                  />
                  <PriceChangeDisplay priceChange={priceChange} />
                </div>

                <StoreChainMultiSelect
                  chains={availableChains}
                  selectedChains={selectedChains}
                  onChainsChange={handleChainsChange}
                  className="w-full sm:w-sm"
                />
              </div>

              <TabsContent value={period} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-6 animate-spin" />
                      Učitavanje povijesti cijena...
                    </div>
                  </div>
                ) : chartData.length === 0 || hasError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Nema dostupnih povijesnih podataka.
                    </p>
                  </div>
                ) : (
                  <ChartContainer config={chartConfig}>
                    <LineChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={true} />

                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          typeof value === "string"
                            ? value.slice(0, -5)
                            : String(value)
                        }
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
                        ticks={yAxisTicks}
                      />

                      <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent />}
                      />

                      {eans.map((ean, index) => (
                        <Line
                          key={ean}
                          dataKey={ean}
                          type="bump"
                          stroke={`var(--chart-${(index % 13) + 1})`}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ChartContainer>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
