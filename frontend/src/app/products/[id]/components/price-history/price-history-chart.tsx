"use client";

import React, { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { storeNamesMap } from "@/utils/mappings";
import { useUser } from "@/context/user-context";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";

interface PriceHistoryChartProps {
  priceHistoryData: HistoryDataPoint[];
  priceHistoryChains: string[];
  selectedChains: string[];
}

const PriceHistoryChart = React.memo(function PriceHistoryChart({
  priceHistoryData,
  priceHistoryChains,
  selectedChains,
}: PriceHistoryChartProps) {
  const { user } = useUser();

  // Filter chains to display based on user selection with sanitization
  const chainsToDisplay = useMemo(() => {
    // Get intersection of selectedChains and priceHistoryChains
    const intersection = priceHistoryChains.filter((chain) =>
      selectedChains.includes(chain)
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
    return priceHistoryData.map((dataPoint) => {
      const chartPoint: Record<string, any> = {
        date: dataPoint.date,
      };

      // Add average price for each chain present in this data point
      if (dataPoint.product?.chains) {
        dataPoint.product.chains.forEach((chainData) => {
          const avgPrice = parseFloat(chainData.avg_price);
          if (Number.isFinite(avgPrice)) {
            chartPoint[chainData.chain] = avgPrice;
          }
        });
      }

      return chartPoint;
    });
  }, [priceHistoryData]);

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    priceHistoryChains.forEach((chain) => {
      cfg[chain] = { label: storeNamesMap[chain] || chain };
    });
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
          tickFormatter={(value, index) => value.slice(0, -5)}
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
        />

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

        {chainsToDisplay.map((chainCode, index) => {
          const pinnedStoreIds =
            user?.pinnedStores?.map((store) => store.storeApiId) || [];
          const isPinned = pinnedStoreIds.includes(chainCode);

          return (
            <Line
              key={chainCode}
              dataKey={chainCode}
              type="bump"
              stroke={`var(--chart-${(index % 13) + 1})`}
              strokeWidth={isPinned ? 2 : 0.4}
              dot={false}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );
});

export default PriceHistoryChart;
