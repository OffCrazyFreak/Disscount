"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartDataPoint } from "@/typings/chart-data";
import { useTouchTooltipDismiss } from "@/hooks/use-touch-tooltip-dismiss";

interface IShoppingListPriceHistoryChartProps {
  chartData: ChartDataPoint[];
  chartConfig: ChartConfig;
  eans: string[];
  yAxisTicks: number[];
}

export default function ShoppingListPriceHistoryChart({
  chartData,
  chartConfig,
  eans,
  yAxisTicks,
}: IShoppingListPriceHistoryChartProps) {
  const { tooltipActive, touchHandlers } = useTouchTooltipDismiss();

  return (
    <ChartContainer config={chartConfig} {...touchHandlers}>
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
          ticks={yAxisTicks}
        />

        <ChartTooltip
          active={tooltipActive}
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
  );
}
