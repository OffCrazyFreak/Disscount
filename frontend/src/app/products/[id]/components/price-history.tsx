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
import { storeNamesMap } from "@/utils/mappings";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { getAppStorage, setAppStorage } from "@/lib/api/local-storage";
import { formatDate } from "@/utils/strings";

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
  const [selectedPeriod, setSelectedPeriod] = useState(
    getAppStorage()?.priceHistoryPeriod || "1W"
  );

  useEffect(() => {
    setAppStorage({ priceHistoryPeriod: selectedPeriod });
  }, [selectedPeriod]);

  // Calculate days to show based on selected period
  const daysToShow: number = useMemo(() => {
    return periodOptions[selectedPeriod as PeriodOption]?.days || 7;
  }, [selectedPeriod]);

  // Use the shared price history hook which fetches snapshots in parallel
  const {
    data: chartData,
    chains: historyChains,
    isLoading: historyLoading,
    isError: historyError,
  } = usePriceHistory({ ean, days: daysToShow });

  // Ensure dates displayed on the X axis are formatted using formatDate util
  const formattedChartData = useMemo(() => {
    const arr = (chartData ?? []).map((row) => ({
      ...row,
      date: formatDate(String(row.date)),
    }));
    return arr;
  }, [chartData]);

  // Memoize sorted chains for the chart lines
  const sortedChains = useMemo(() => {
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        Povijest cijena{" "}
        {periodOptions[selectedPeriod as PeriodOption].title || ""}
      </h2>
      <Card>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="">
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="1Y">1Y</TabsTrigger>
              <TabsTrigger value="ALL">All</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="mt-4">
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
                <ChartContainer config={{}}>
                  <LineChart
                    accessibilityLayer
                    data={formattedChartData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
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
                            selectedPeriod === "1W"
                              ? 1
                              : selectedPeriod === "1M"
                              ? 3
                              : selectedPeriod === "1Y"
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

                    {sortedChains.map((chainCode, index) => (
                      <Line
                        key={chainCode}
                        dataKey={chainCode}
                        type="basis"
                        stroke={`var(--chart-${(index % 5) + 1})`}
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
    </div>
  );
}
