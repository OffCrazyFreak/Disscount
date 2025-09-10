"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import cijeneService from "@/lib/cijene-api";
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
}

export default function PriceHistory({ ean }: PriceHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const data = getAppStorage();
    const storedPeriod = data.priceHistoryPeriod;
    if (storedPeriod && ["1W", "1M", "1Y", "ALL"].includes(storedPeriod)) {
      return storedPeriod;
    }
    return "1W";
  });

  useEffect(() => {
    setAppStorage({ priceHistoryPeriod: selectedPeriod });
  }, [selectedPeriod]);

  // Calculate dates based on selected period
  const dates = useMemo(() => {
    const dateArray = [];
    const today = new Date();
    let startDate: Date;
    let daysToShow: number;

    switch (selectedPeriod) {
      case "1W":
        daysToShow = 7;
        break;
      case "1M":
        daysToShow = 30;
        break;
      case "1Y":
        daysToShow = 365;
        break;
      case "ALL":
        startDate = new Date("2025-05-17");
        daysToShow = Math.ceil(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        break;
      default:
        daysToShow = 7;
    }

    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().split("T")[0];
      const label = formatDate(formattedDate);
      dateArray.push({ label, date: formattedDate });
    }

    return dateArray;
  }, [selectedPeriod]);

  // Fetch current product data to get available chains
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = cijeneService.useGetProductByEan({
    ean,
  });

  // Always create hooks for all possible dates to maintain consistent hook count
  const allPossibleDates = useMemo(() => {
    const dateArray = [];
    const today = new Date();
    const startDate = new Date("2025-05-16");
    const daysDiff = Math.ceil(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().split("T")[0];
      const label = formatDate(formattedDate);
      dateArray.push({ label, date: formattedDate });
    }

    return dateArray;
  }, []);

  // Create hooks for all possible dates (fixed number)
  const productQueries = allPossibleDates.map(({ date }) =>
    cijeneService.useGetProductByEan({
      ean,
      date,
    })
  );

  // Filter to only use the dates for the selected period
  const allProducts = dates.map((dateItem) => {
    const queryIndex = allPossibleDates.findIndex(
      (d) => d.date === dateItem.date
    );
    return {
      ...productQueries[queryIndex],
      date: dateItem,
    };
  });

  // Transform data for chart
  const chartData = useMemo(() => {
    const dataMap: Record<string, any> = {};

    allProducts.forEach(({ data, date }) => {
      if (!data) return;

      data.chains.forEach((chain) => {
        if (!dataMap[date.date]) {
          dataMap[date.date] = { date: date.label };
        }
        dataMap[date.date][chain.chain] = parseFloat(chain.avg_price);
      });
    });

    return Object.values(dataMap);
  }, [allProducts]);

  // Create chart config dynamically based on available chains
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
    ];

    if (product?.chains) {
      product.chains.forEach((chain, index) => {
        config[chain.chain] = {
          label: storeNamesMap[chain.chain] || chain.chain,
          color: colors[index % colors.length],
        };
      });
    }

    return config;
  }, [product?.chains]);

  // Calculate Y axis domain
  const yAxisDomain = useMemo(() => {
    if (!chartData.length) return [0, "dataMax"] as [number, string];

    let minPrice = Infinity;
    let maxPrice = -Infinity;

    chartData.forEach((dataPoint) => {
      Object.keys(dataPoint).forEach((key) => {
        if (key !== "date" && dataPoint[key] !== undefined) {
          const price = parseFloat(dataPoint[key]);
          if (!isNaN(price)) {
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
          }
        }
      });
    });

    if (minPrice === Infinity || maxPrice === -Infinity) {
      return [0, "dataMax"] as [number, string];
    }

    const lowerBound = Math.floor(minPrice * 0.9);
    const upperBound = Math.ceil(maxPrice * 1.1);

    return [lowerBound, upperBound] as [number, number];
  }, [chartData]);

  if (productLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Povijest cijena (od 17.5.2025.)
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="size-6 animate-spin" />
            Učitavanje povijesti cijena...
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Povijest cijena (od 17.5.2025.)
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">
            Greška pri učitavanju podataka za grafikon.
          </p>
        </div>
      </div>
    );
  }

  const getTitlePeriod = () => {
    switch (selectedPeriod) {
      case "1W":
        return "(posljednjih 7 dana)";
      case "1M":
        return "(posljednjih 30 dana)";
      case "1Y":
        return "(posljednjih 365 dana)";
      case "ALL":
        return "(od početka)";
      default:
        return "";
    }
  };

  if (productLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="size-6 animate-spin" />
            Učitavanje povijesti cijena...
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-gray-600">
            Greška pri učitavanju povijesti cijena.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        Povijest cijena {getTitlePeriod()}
      </h2>
      <Card>
        <CardContent>
          <Tabs
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="1Y">1Y</TabsTrigger>
              <TabsTrigger value="ALL">All</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedPeriod} className="mt-4">
              {allProducts.some((p) => p.isLoading) ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-6 animate-spin" />
                    Učitavanje povijesti cijena...
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Nema dostupnih podataka za grafikon.
                  </p>
                </div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
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
                          if (selectedPeriod === "1W") {
                            return day % frequency === 0
                              ? `${day}.${month}.`
                              : "";
                          } else if (selectedPeriod === "1M") {
                            return day % frequency === 0
                              ? `${day}.${month}.`
                              : "";
                          } else {
                            // For longer periods, show every Nth day
                            return day % frequency === 0
                              ? `${day}.${month}.`
                              : "";
                          }
                        }
                        return value;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `${value} €`}
                      domain={yAxisDomain}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    {product?.chains
                      .sort((a, b) => {
                        const nameA = storeNamesMap[a.chain] || a.chain;
                        const nameB = storeNamesMap[b.chain] || b.chain;
                        return nameA.localeCompare(nameB, "hr", {
                          sensitivity: "base",
                        });
                      })
                      .map((chain, index) => (
                        <Line
                          key={chain.chain}
                          dataKey={chain.chain}
                          type="basis"
                          stroke={`var(--color-${chain.chain})`}
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
