"use client";

import { ReactElement, ReactNode } from "react";
import { CartesianGrid, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { ChartDataPoint } from "@/typings/chart-data";
import { useTouchTooltipDismiss } from "@/hooks/use-touch-tooltip-dismiss";

interface IPriceHistoryChartShellProps {
  chartData: ChartDataPoint[];
  chartConfig: ChartConfig;
  yAxisTicks: number[];
  tooltipContent: ReactElement;
  children: ReactNode;
}

// Shared line-chart frame for the product and shopping-list price histories:
// identical container, grid, axes and tooltip; each caller supplies its own
// <Line> elements, tooltip content and pre-computed Y-axis ticks.
export default function PriceHistoryChartShell({
  chartData,
  chartConfig,
  yAxisTicks,
  tooltipContent,
  children,
}: IPriceHistoryChartShellProps) {
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
          content={tooltipContent}
        />

        {children}
      </LineChart>
    </ChartContainer>
  );
}
