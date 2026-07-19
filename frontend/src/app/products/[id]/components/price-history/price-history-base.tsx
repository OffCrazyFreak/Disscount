"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import PriceHistoryHeader from "@/app/products/[id]/components/price-history/price-history-header";
import PriceHistoryControls from "@/app/products/[id]/components/price-history/price-history-controls";
import PriceHistoryPanel from "@/app/products/[id]/components/price-history/price-history-panel";
import { usePriceHistoryChart } from "@/app/products/[id]/components/price-history/use-price-history-chart";

interface IPriceHistoryProps {
  product: ProductResponse;
}

export default function PriceHistory({ product }: IPriceHistoryProps) {
  const {
    chartPrefs,
    isPriceHistoryOpen,
    setIsPriceHistoryOpen,
    priceHistoryData,
    priceHistoryChains,
    historyLoading,
    historyError,
    handlePeriodChange,
    handleChainsChange,
    priceChange,
  } = usePriceHistoryChart(product);

  return (
    <Collapsible open={isPriceHistoryOpen} onOpenChange={setIsPriceHistoryOpen}>
      <CollapsibleTrigger asChild className="py-2">
        <button type="button" className="w-full text-left">
          <PriceHistoryHeader isOpen={isPriceHistoryOpen} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
              <PriceHistoryControls
                period={chartPrefs.period}
                onPeriodChange={handlePeriodChange}
                priceChange={priceChange}
                chains={priceHistoryChains}
                selectedChains={chartPrefs.chains}
                onChainsChange={handleChainsChange}
              />

              <TabsContent value={chartPrefs.period} className="mt-4">
                <PriceHistoryPanel
                  historyLoading={historyLoading}
                  historyError={historyError}
                  priceHistoryData={priceHistoryData}
                  priceHistoryChains={priceHistoryChains}
                  selectedChains={chartPrefs.chains}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
