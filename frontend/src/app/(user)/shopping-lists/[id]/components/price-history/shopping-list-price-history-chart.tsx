"use client";

import { Line } from "recharts";
import { ChartConfig, ChartTooltipContent } from "@/components/ui/chart";
import { ChartDataPoint } from "@/typings/chart-data";
import PriceHistoryChartShell from "@/components/custom/price/price-history-chart-shell";

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
  return (
    <PriceHistoryChartShell
      chartData={chartData}
      chartConfig={chartConfig}
      yAxisTicks={yAxisTicks}
      tooltipContent={<ChartTooltipContent />}
    >
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
    </PriceHistoryChartShell>
  );
}
