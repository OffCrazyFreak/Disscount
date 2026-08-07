"use client";

import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import StoreChainMultiSelect from "@/components/custom/store-chain/store-chain-multi-select";
import PriceHistoryPeriodSelect from "@/components/custom/price/price-history-period-select";
import PriceChangeDisplay from "@/components/custom/price/price-change-display";
import ChartSkeleton from "@/components/custom/skeleton/chart-skeleton";
import AsyncSection from "@/components/custom/common/async-section";
import { ShoppingListDto } from "@/lib/api/types";
import { PeriodOption } from "@/typings/history-period-options";
import { DISABLED_PERIODS, getEnabledPeriod } from "@/constants/price-history";
import {
  getShoppingListPriceHistoryOpen,
  setShoppingListPriceHistoryOpen,
  getShoppingListPriceHistoryPeriod,
  setShoppingListPriceHistoryPeriod,
} from "@/utils/browser/local-storage";
import { useShoppingListPriceHistory } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-price-history";
import ShoppingListPriceHistoryChart from "@/app/(user)/shopping-lists/[id]/components/price-history/shopping-list-price-history-chart";
import PriceHistoryToggleHeader from "@/app/(user)/shopping-lists/[id]/components/price-history/price-history-toggle-header";

/** Same copy whether a day failed or the list simply has no history behind it. */
function NoPriceHistory() {
  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Nema dostupnih povijesnih podataka.</p>
    </div>
  );
}

interface IShoppingListPriceHistoryProps {
  shoppingList: ShoppingListDto;
  /** False until the page's own price fetches have settled. See useSettledOnce. */
  enabled?: boolean;
}

export default function ShoppingListPriceHistory({
  shoppingList,
  enabled = true,
}: IShoppingListPriceHistoryProps) {
  const [period, setPeriod] = useState<PeriodOption>(() =>
    getEnabledPeriod(getShoppingListPriceHistoryPeriod(shoppingList.id)),
  );

  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(() =>
    getShoppingListPriceHistoryOpen(shoppingList.id),
  );

  const {
    eans,
    availableChains,
    selectedChains,
    handleChainsChange,
    chartData,
    chartConfig,
    yAxisTicks,
    isLoading,
    hasError,
    priceChange,
  } = useShoppingListPriceHistory(shoppingList, period, enabled);

  const handlePeriodChange = useCallback(
    (value: string) => {
      const newPeriod = value as PeriodOption;
      setPeriod(newPeriod);
      setShoppingListPriceHistoryPeriod(shoppingList.id, newPeriod);
    },
    [shoppingList.id],
  );

  if (!shoppingList.items || shoppingList.items.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isPriceHistoryOpen}
      onOpenChange={(open) => {
        setIsPriceHistoryOpen(open);
        setShoppingListPriceHistoryOpen(shoppingList.id, open);
      }}
    >
      <PriceHistoryToggleHeader isOpen={isPriceHistoryOpen} />

      <CollapsibleContent>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center justify-between w-full gap-2">
                  <PriceHistoryPeriodSelect
                    disabledPeriods={DISABLED_PERIODS}
                  />

                  <PriceChangeDisplay priceChange={priceChange} />
                </div>

                <StoreChainMultiSelect
                  chains={availableChains}
                  selectedChains={selectedChains}
                  onChainsChange={handleChainsChange}
                  className="w-full sm:w-sm"
                />
              </div>

              <TabsContent value={period} className="mt-4">
                <AsyncSection
                  pending={isLoading}
                  error={hasError ? new Error("Nema podataka") : undefined}
                  isEmpty={chartData.length === 0}
                  skeleton={<ChartSkeleton />}
                  // A failed day and a genuinely flat history are the same dead end
                  // here, so they read the same rather than blaming the user's list.
                  errorState={<NoPriceHistory />}
                  empty={<NoPriceHistory />}
                >
                  <ShoppingListPriceHistoryChart
                    chartData={chartData}
                    chartConfig={chartConfig}
                    eans={eans}
                    yAxisTicks={yAxisTicks}
                  />
                </AsyncSection>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
