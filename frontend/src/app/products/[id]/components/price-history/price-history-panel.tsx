import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import PriceHistoryChart from "@/app/products/[id]/components/price-history/price-history-chart";
import { HistoryDataPoint } from "@/app/products/[id]/typings/history-data-point";

interface IPriceHistoryPanelProps {
  historyLoading: boolean;
  historyError: boolean;
  priceHistoryData: HistoryDataPoint[];
  priceHistoryChains: string[];
  selectedChains: string[];
}

export default function PriceHistoryPanel({
  historyLoading,
  historyError,
  priceHistoryData,
  priceHistoryChains,
  selectedChains,
}: IPriceHistoryPanelProps) {
  if (historyLoading) {
    return (
      <div className="grid place-items-center">
        <BlockLoadingSpinner />
      </div>
    );
  }

  if (priceHistoryData.length === 0 || historyError) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nema dostupnih povijesnih podataka.</p>
      </div>
    );
  }

  return (
    <PriceHistoryChart
      priceHistoryData={priceHistoryData}
      priceHistoryChains={priceHistoryChains}
      selectedChains={selectedChains}
    />
  );
}
