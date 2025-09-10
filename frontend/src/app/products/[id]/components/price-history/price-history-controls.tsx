"use client";

import { memo } from "react";
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

interface PriceHistoryControlsProps {
  chartPrefs: {
    period: string;
    chains: string[];
  };
  allAvailableChains: string[];
  onPeriodChange: (period: string) => void;
  onChainsChange: (chains: string[]) => void;
}

const PriceHistoryControls = memo(function PriceHistoryControls({
  chartPrefs,
  allAvailableChains,
  onPeriodChange,
  onChainsChange,
}: PriceHistoryControlsProps) {
  return (
    <div className="flex align-center justify-between mb-4">
      <Tabs value={chartPrefs.period} onValueChange={onPeriodChange}>
        <TabsList className="">
          <TabsTrigger value="1W">1W</TabsTrigger>
          <TabsTrigger value="1M">1M</TabsTrigger>
          <TabsTrigger value="1Y">1Y</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <MultiSelect values={chartPrefs.chains} onValuesChange={onChainsChange}>
        <MultiSelectTrigger className="w-xs">
          <MultiSelectValue placeholder="Odaberi trgovinske lance..." />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectGroup>
            {allAvailableChains.map((chainCode) => (
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
