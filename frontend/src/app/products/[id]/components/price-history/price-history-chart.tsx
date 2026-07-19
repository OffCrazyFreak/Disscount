"use client";

import { useMemo, memo } from "react";
import { Line } from "recharts";
import { ChartConfig, ChartTooltipContent } from "@/components/ui/chart";
import { getChainLabel } from "@/utils/labels";
import { useUser } from "@/context/user-context";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";
import { ChartDataPoint } from "@/typings/chart-data";
import PriceHistoryChartShell from "@/components/custom/price/price-history-chart-shell";

interface IPriceHistoryChartProps {
  priceHistoryData: HistoryDataPoint[];
  priceHistoryChains: string[];
  selectedChains: string[];
}

const PriceHistoryChart = memo(function PriceHistoryChart({
  priceHistoryData,
  priceHistoryChains,
  selectedChains,
}: IPriceHistoryChartProps) {
  const { user } = useUser();

  const pinnedStoreIds = useMemo(
    () => user?.pinnedStores?.map((store) => store.storeApiId) || [],
    [user?.pinnedStores],
  );

  // Filter chains to display based on user selection, falling back to all
  // available chains when the selection is empty.
  const chainsToDisplay = useMemo(() => {
    const intersection = priceHistoryChains.filter((chain) =>
      selectedChains.includes(chain),
    );

    if (intersection.length === 0 || !selectedChains?.length) {
      return priceHistoryChains.length > 0 ? priceHistoryChains : [];
    }

    return intersection;
  }, [priceHistoryChains, selectedChains]);

  // Convert HistoryDataPoint[] to chart rows, adding a per-row average of the
  // selected chains under the "_average" key.
  const chartData = useMemo(() => {
    return priceHistoryData.map((dataPoint): ChartDataPoint => {
      const chartPoint: ChartDataPoint = { date: dataPoint.date };

      if (dataPoint.product?.chains) {
        const prices: number[] = [];

        dataPoint.product.chains.forEach((chainData) => {
          const avgPrice = parseFloat(chainData.avg_price);
          if (Number.isFinite(avgPrice)) {
            chartPoint[chainData.chain] = avgPrice;

            if (chainsToDisplay.includes(chainData.chain)) {
              prices.push(avgPrice);
            }
          }
        });

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
      cfg[chain] = { label: getChainLabel(chain) };
    });
    cfg["_average"] = { label: "Prosjek" };
    return cfg;
  }, [priceHistoryChains]);

  const yAxisTicks = useMemo(() => {
    const padding = 0.05;
    const selectedValues = chartData.flatMap((d) =>
      Object.entries(d)
        .filter(([k]) => k !== "date" && chainsToDisplay.includes(k))
        .map(([, v]) => (typeof v === "number" ? v : 0)),
    );
    const hasValues = chartData.length > 0 && chainsToDisplay.length > 0;
    const paddedMin = hasValues ? Math.min(...selectedValues) * (1 - padding) : 0;
    const paddedMax = hasValues ? Math.max(...selectedValues) * (1 + padding) : 1;

    const ticks = [];
    const step = 0.25;
    const start = Math.floor(paddedMin / step) * step;
    const end = Math.ceil(paddedMax / step) * step;

    for (let i = start; i <= end; i += step) {
      ticks.push(parseFloat(i.toFixed(2)));
    }
    return ticks;
  }, [chartData, chainsToDisplay]);

  return (
    <PriceHistoryChartShell
      chartData={chartData}
      chartConfig={chartConfig}
      yAxisTicks={yAxisTicks}
      tooltipContent={<ChartTooltipContent pinnedStoreIds={pinnedStoreIds} />}
    >
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

      <Line
        key="_average"
        dataKey="_average"
        type="bump"
        stroke="#999"
        strokeWidth={1}
        strokeDasharray="5 5"
        dot={false}
      />
    </PriceHistoryChartShell>
  );
});

export default PriceHistoryChart;
