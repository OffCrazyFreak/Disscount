"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import PriceHistoryControls from "@/app/[locale]/products/[id]/components/price-history/price-history-controls";
import PriceHistoryPanel from "@/app/[locale]/products/[id]/components/price-history/price-history-panel";
import { usePriceHistoryChart } from "@/app/[locale]/products/[id]/hooks/use-price-history-chart";

interface IPriceHistoryProps {
  product: ProductResponse;
}

export default function PriceHistory({ product }: IPriceHistoryProps) {
  const {
    chartPrefs,
    priceHistoryData,
    priceHistoryChains,
    historyLoading,
    historyError,
    handlePeriodChange,
    handleChainsChange,
    priceChange,
  } = usePriceHistoryChart(product);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <Tabs value={chartPrefs.period} onValueChange={handlePeriodChange}>
          <PriceHistoryControls
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
  );
}
