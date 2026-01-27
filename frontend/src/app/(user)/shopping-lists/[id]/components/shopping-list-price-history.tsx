"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import StoreChainMultiSelect from "@/components/custom/store-chain-multi-select";
import PriceHistoryPeriodSelect from "@/components/custom/price-history-period-select";
import PriceChangeDisplay from "@/components/custom/price-change-display";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import { ChevronDown } from "lucide-react";
import { ShoppingListDto } from "@/lib/api/types";
import cijeneService from "@/lib/cijene-api";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { PeriodOption } from "@/typings/history-period-options";
import { periodOptions } from "@/constants/price-history";
import { useUser } from "@/context/user-context";
import { calculatePriceChange } from "@/app/products/utils/product-utils";
import { formatDate } from "@/utils/strings";
import {
  getShoppingListPriceHistoryOpen,
  setShoppingListPriceHistoryOpen,
  getShoppingListPriceHistoryPeriod,
  setShoppingListPriceHistoryPeriod,
  getShoppingListPriceHistoryChains,
  setShoppingListPriceHistoryChains,
} from "@/utils/browser/local-storage";

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
  const [period, setPeriod] = useState<PeriodOption>(() =>
    getShoppingListPriceHistoryPeriod(shoppingList.id),
  );

  // Initialize with empty array - will be set by useEffect after availableChains loads
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(() =>
    getShoppingListPriceHistoryOpen(shoppingList.id),
  );

  const daysToShow = useMemo(() => {
    return periodOptions[period]?.days || 7;
  }, [period]);

  // Get all EANs from shopping list items
  const eans = useMemo(() => {
    return shoppingList.items?.map((item) => item.ean) || [];
  }, [shoppingList.items]);

  // Generate dates for fetching price history
  const dates = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    const START_DATE = new Date("2025-05-16");
    const maxDaysFromCap = Math.max(
      0,
      Math.ceil(
        (today.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    let cappedDays: number;
    if (daysToShow === -1) {
      cappedDays = maxDaysFromCap;
    } else {
      cappedDays = Math.min(daysToShow, maxDaysFromCap);
    }

    for (let i = 0; i < cappedDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr.reverse(); // chronological
  }, [daysToShow]);

  // Fetch price history using useQueries to avoid hooks in loops
  const queries = useQueries({
    queries: eans.flatMap((ean) =>
      dates.map((date, index) => ({
        queryKey: ["cijene", "product", "history", ean, date],
        queryFn: () => cijeneService.getProductByEan({ ean, date }),
        enabled: !!ean,
        staleTime:
          index === 0 || index === dates.length - 1
            ? 60 * 1000
            : 6 * 60 * 60 * 1000,
      })),
    ),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.isError);

  // Group queries by EAN for processing
  const priceHistoriesByEan = useMemo(() => {
    const result: Record<string, ProductResponse[]> = {};
    eans.forEach((ean, eanIndex) => {
      const startIdx = eanIndex * dates.length;
      const endIdx = startIdx + dates.length;
      result[ean] = queries
        .slice(startIdx, endIdx)
        .map((q) => q.data as ProductResponse)
        .filter(Boolean);
    });
    return result;
  }, [queries, eans, dates.length]);

  // Get all available chains from the price histories
  const availableChains = useMemo(() => {
    const chainSet = new Set<string>();
    Object.values(priceHistoriesByEan).forEach((products) => {
      products.forEach((product) => {
        product.chains?.forEach((chain) => chainSet.add(chain.chain));
      });
    });
    return Array.from(chainSet);
  }, [priceHistoriesByEan]);

  // Initialize selected chains - runs only when availableChains changes from empty to populated
  useEffect(() => {
    if (availableChains.length === 0) return;

    // First try to load from localStorage
    const savedChains = getShoppingListPriceHistoryChains(shoppingList.id);

    if (savedChains && savedChains.length > 0) {
      // Use saved chains if they exist in available chains
      const validSavedChains = savedChains.filter((chain) =>
        availableChains.includes(chain),
      );
      if (validSavedChains.length > 0) {
        setSelectedChains(validSavedChains);
        return;
      }
    }

    // Fall back to preferred stores or all chains
    const preferredStoreIds =
      user?.pinnedStores?.map((s) => s.storeApiId) || [];
    const preferredChains = availableChains.filter((chain) =>
      preferredStoreIds.includes(chain),
    );

    const chainsToSet =
      preferredChains.length > 0 ? preferredChains : availableChains;
    setSelectedChains(chainsToSet);
    setShoppingListPriceHistoryChains(shoppingList.id, chainsToSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableChains.join(","), shoppingList.id]);

  // Transform data: calculate average price per product per day
  const chartData = useMemo(() => {
    if (eans.length === 0 || dates.length === 0) {
      return [];
    }

    const dateMap = new Map<
      string,
      { isoDate: string; data: ChartDataPoint }
    >();

    eans.forEach((ean) => {
      const products = priceHistoriesByEan[ean] || [];

      products.forEach((product, dateIndex) => {
        const date = dates[dateIndex];
        if (!date) return;

        if (!dateMap.has(date)) {
          dateMap.set(date, {
            isoDate: date,
            data: { date: formatDate(date) },
          });
        }

        const entry = dateMap.get(date)!;
        const chartPoint = entry.data;

        // Calculate average price across selected chains only
        if (product?.chains && product.chains.length > 0) {
          const prices: number[] = [];

          product.chains.forEach((chainData) => {
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

    return Array.from(dateMap.values())
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
      .map((entry) => entry.data);
  }, [priceHistoriesByEan, eans, dates, selectedChains]);

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
        .map(([_, v]) => (typeof v === "number" ? v : 0)),
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

  const handlePeriodChange = useCallback(
    (value: string) => {
      const newPeriod = value as PeriodOption;
      setPeriod(newPeriod);
      setShoppingListPriceHistoryPeriod(shoppingList.id, newPeriod);
    },
    [shoppingList.id],
  );

  const handleChainsChange = useCallback(
    (chains: string[]) => {
      if (chains.length > 0) {
        setSelectedChains(chains);
        setShoppingListPriceHistoryChains(shoppingList.id, chains);
      }
    },
    [shoppingList.id],
  );

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) || [],
    [user?.pinnedStores],
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
    <Collapsible
      open={isPriceHistoryOpen}
      onOpenChange={(open) => {
        setIsPriceHistoryOpen(open);
        setShoppingListPriceHistoryOpen(shoppingList.id, open);
      }}
    >
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
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PriceHistoryPeriodSelect
                    value={period}
                    onChange={handlePeriodChange}
                    disabledPeriods={["1Y", "ALL"]}
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
                  <div className="grid place-items-center">
                    <BlockLoadingSpinner />
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
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
