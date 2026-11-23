import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { HistoryDataPoint } from "@/lib/cijene-api/history-data-point";

function loadPriceHistoryChart() {
  return import("@/app/[locale]/products/[id]/components/price-history/price-history-chart");
}

// Lazy so recharts stays out of the first load; the placeholder has the chart's aspect-video size.
const PriceHistoryChart = dynamic(loadPriceHistoryChart, {
  ssr: false,
  loading: () => <div className="aspect-video" />,
});

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
  const t = useTranslations("productDetail.priceHistory");

  // Fetch the chart code while the history is still loading, not after it.
  useEffect(() => {
    // A failed preload is reported when the chart itself renders.
    loadPriceHistoryChart().catch(() => {});
  }, []);

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
        <p className="text-gray-600">{t("empty")}</p>
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
