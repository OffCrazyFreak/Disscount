"use client";

import { memo, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { storeNamesMap } from "@/utils/mappings";
import {
  getAveragePrice,
  calculatePriceChange,
} from "@/lib/cijene-api/utils/product-utils";
import { ArrowBigUpDash } from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";
import { PeriodOption } from "../../typings/history-period-options";

interface PriceHistoryControlsProps {
  chartPrefs: {
    period: string;
    chains: string[];
  };
  priceHistoryChains: string[];
  onPeriodChange: (period: string) => void;
  onChainsChange: (chains: string[]) => void;
  priceHistoryData: HistoryDataPoint[];
}

const PriceHistoryControls = memo(function PriceHistoryControls({
  chartPrefs,
  priceHistoryData,
  priceHistoryChains,
  onPeriodChange,
  onChainsChange,
}: PriceHistoryControlsProps) {
  // Calculate current and historical average prices based on available data
  const priceChange: { difference: number; percentage: number } | null =
    useMemo(() => {
      if (priceHistoryData.length === 0) {
        return null;
      }

      // Get the most recent and oldest data points with valid products
      const currentAvgPrice = getAveragePrice(
        priceHistoryData[priceHistoryData.length - 1].product
      );
      const historicalAvgPrice = getAveragePrice(priceHistoryData[0].product);

      if (currentAvgPrice == null || historicalAvgPrice == null) {
        return null;
      }

      return calculatePriceChange(currentAvgPrice, historicalAvgPrice);
    }, [priceHistoryData]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
        <TabsList>
          <TabsTrigger value="1W">1W</TabsTrigger>
          <TabsTrigger value="1M">1M</TabsTrigger>
          <TabsTrigger value="1Y">1Y</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        {priceChange && (
          <h3
            className={cn(
              "text-right flex gap-2 flex-wrap items-center justify-end transition-all",
              {
                "text-red-700": priceChange.difference > 0,
                "text-green-700": priceChange.difference < 0,
                "text-gray-700": priceChange.difference === 0,
              }
            )}
          >
            <span>
              {priceChange.difference > 0 && "+"}
              {priceChange.difference}€
            </span>

            <span>({priceChange.percentage}%)</span>
            <ArrowBigUpDash
              className={cn("hidden sm:inline", {
                "rotate-180": priceChange.difference < 0,
              })}
            />
          </h3>
        )}
      </div>

      <MultiSelect values={chartPrefs.chains} onValuesChange={onChainsChange}>
        <MultiSelectTrigger className="w-full sm:w-sm">
          <MultiSelectValue placeholder="Odaberi trgovinske lance..." />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectGroup>
            {priceHistoryChains.map((chainCode) => (
              <MultiSelectItem key={chainCode} value={chainCode}>
                {storeNamesMap[chainCode] || chainCode}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
});

export default PriceHistoryControls;
