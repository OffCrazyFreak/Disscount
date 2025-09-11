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
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ArrowBigUpDash } from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";

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
        return {
          difference: 0,
          percentage: 0,
        };
      }

      // Get the most recent and oldest data points with valid products
      const currentAvgPrice = getAveragePrice(
        priceHistoryData[priceHistoryData.length - 1]?.product
      );
      const historicalAvgPrice = getAveragePrice(priceHistoryData[0]?.product);

      if (!currentAvgPrice || !historicalAvgPrice) {
        return null;
      }

      return calculatePriceChange(currentAvgPrice, historicalAvgPrice);
    }, [priceHistoryData]);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex align-center gap-4">
        <Tabs value={chartPrefs.period} onValueChange={onPeriodChange}>
          <TabsList className="">
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {priceChange && (
          <h3
            className={cn("flex items-center gap-2 transition-transform", {
              "text-red-700": priceChange.difference > 0,
              "text-green-700": priceChange.difference < 0,
              "text-gray-700": priceChange.difference === 0,
            })}
          >
            <span className="">
              {priceChange.difference > 0 && "+"}{" "}
              {priceChange.difference.toFixed(2)} (
              {priceChange.percentage.toFixed(2)}%)
            </span>
            <ArrowBigUpDash
              className={cn({
                "rotate-180": priceChange.difference < 0,
              })}
            />
          </h3>
        )}
      </div>

      <MultiSelect values={chartPrefs.chains} onValuesChange={onChainsChange}>
        <MultiSelectTrigger className="w-xs">
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
