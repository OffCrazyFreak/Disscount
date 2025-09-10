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

interface PriceHistoryChartProps {
  formattedChartData: any[];
  allAvailableChains: string[];
  chainsToDisplay: string[];
}

const PriceHistoryChart = React.memo(function PriceHistoryChart({
  formattedChartData,
  allAvailableChains,
  chainsToDisplay,
}: PriceHistoryChartProps) {
  const { user } = useUser();

  const chartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    allAvailableChains.forEach((chain) => {
      cfg[chain] = { label: storeNamesMap[chain] || chain };
    });
    return cfg;
  }, [allAvailableChains]);

  return (
    <ChartContainer config={chartConfig}>
      <LineChart accessibilityLayer data={formattedChartData}>
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
              stroke={`var(--chart-${(index % 5) + 1})`}
              strokeWidth={isPinned ? 2 : 0.3}
              dot={false}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );
});

export default PriceHistoryChart;
