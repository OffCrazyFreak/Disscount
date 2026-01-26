"use client";

import React, { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { storeNamesMap } from "@/constants/store-mappings";
import { useUser } from "@/context/user-context";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";
import { ChartDataPoint } from "@/typings/chart-data";

interface IPriceHistoryChartProps {
  priceHistoryData: HistoryDataPoint[];
  priceHistoryChains: string[];
  selectedChains: string[];
}

const PriceHistoryChart = React.memo(function PriceHistoryChart({
  priceHistoryData,
  priceHistoryChains,
  selectedChains,
}: IPriceHistoryChartProps) {
  const { user } = useUser();

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) || [],
    [user?.pinnedStores],
  );

  // Filter chains to display based on user selection with sanitization
  const chainsToDisplay = useMemo(() => {
    // Get intersection of selectedChains and priceHistoryChains
    const intersection = priceHistoryChains.filter((chain) =>
      selectedChains.includes(chain),
    );

    // If intersection is empty or selectedChains is missing, fall back to all available chains
    // Ensure at least one chain is selected
    if (intersection.length === 0 || !selectedChains?.length) {
      return priceHistoryChains.length > 0 ? priceHistoryChains : [];
    }

    return intersection;
  }, [priceHistoryChains, selectedChains]);

  // Transform the data for the chart: convert from HistoryDataPoint[] to chart format
  const chartData = useMemo(() => {
    return priceHistoryData.map((dataPoint): ChartDataPoint => {
      const chartPoint: ChartDataPoint = {
        date: dataPoint.date,
      };

      // Add average price for each chain present in this data point
      if (dataPoint.product?.chains) {
        const prices: number[] = [];

        dataPoint.product.chains.forEach((chainData) => {
          const avgPrice = parseFloat(chainData.avg_price);
          if (Number.isFinite(avgPrice)) {
            chartPoint[chainData.chain] = avgPrice;

            // Collect prices for selected chains to calculate average
            if (chainsToDisplay.includes(chainData.chain)) {
              prices.push(avgPrice);
            }
          }
        });

        // Calculate and add average price for selected chains
        if (prices.length > 0) {
          const avgOfSelected =
            prices.reduce((sum, price) => sum + price, 0) / prices.length;
          chartPoint["_average"] = parseFloat(avgOfSelected.toFixed(2));
        }
      }

      return chartPoint;
    });
  }, [priceHistoryData, chainsToDisplay]);

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    priceHistoryChains.forEach((chain) => {
      cfg[chain] = { label: storeNamesMap[chain] || chain };
    });
    cfg["_average"] = { label: "Prosjek" };
    return cfg;
  }, [priceHistoryChains]);

  return (
    <ChartContainer config={chartConfig}>
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={true} />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) =>
            typeof value === "string" ? value.slice(0, -5) : String(value)
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value.toFixed(2)} €`}
          domain={([dataMin, dataMax]) => {
            const padding = 0.05;
            return [dataMin * (1 - padding), dataMax * (1 + padding)];
          }}
          ticks={useMemo(() => {
            const padding = 0.05;
            const paddedMin =
              chartData.length > 0 && chainsToDisplay.length > 0
                ? Math.min(
                    ...chartData.flatMap((d) =>
                      Object.entries(d)
                        .filter(
                          ([k]) => k !== "date" && chainsToDisplay.includes(k),
                        )
                        .map(([_, v]) => (typeof v === "number" ? v : 0)),
                    ),
                  ) *
                  (1 - padding)
                : 0;
            const paddedMax =
              chartData.length > 0 && chainsToDisplay.length > 0
                ? Math.max(
                    ...chartData.flatMap((d) =>
                      Object.entries(d)
                        .filter(
                          ([k]) => k !== "date" && chainsToDisplay.includes(k),
                        )
                        .map(([_, v]) => (typeof v === "number" ? v : 0)),
                    ),
                  ) *
                  (1 + padding)
                : 1;

            const ticks = [];
            const step = 0.25;
            const start = Math.floor(paddedMin / step) * step;
            const end = Math.ceil(paddedMax / step) * step;

            for (let i = start; i <= end; i += step) {
              ticks.push(parseFloat(i.toFixed(2)));
            }
            return ticks;
          }, [chartData, chainsToDisplay])}
        />

        <ChartTooltip
          cursor={true}
          content={<ChartTooltipContent pinnedStoreIds={pinnedStoreIds} />}
        />

        {chainsToDisplay.map((chainCode, index) => {
          const isPinned = pinnedStoreIds.includes(chainCode);

          return (
            <Line
              key={chainCode}
              dataKey={chainCode}
              type="bump"
              stroke={`var(--chart-${(index % 13) + 1})`}
              strokeWidth={pinnedStoreIds.length === 0 || isPinned ? 2 : 0.4}
              dot={false}
            />
          );
        })}

        {/* Average line for selected chains */}
        <Line
          key="_average"
          dataKey="_average"
          type="bump"
          stroke="#999"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
});

export default PriceHistoryChart;
