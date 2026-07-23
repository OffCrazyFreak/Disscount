import PriceHistoryPeriodSelect from "@/components/custom/price/price-history-period-select";
import StoreChainMultiSelect from "@/components/custom/store-chain/store-chain-multi-select";
import PriceChangeDisplay from "@/components/custom/price/price-change-display";
import { DISABLED_PERIODS } from "@/constants/price-history";

interface IPriceHistoryControlsProps {
  priceChange: { difference: number; percentage: number } | null;
  chains: string[];
  selectedChains: string[];
  onChainsChange: (chains: string[]) => void;
}

export default function PriceHistoryControls({
  priceChange,
  chains,
  selectedChains,
  onChainsChange,
}: IPriceHistoryControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2 justify-between w-full">
        <PriceHistoryPeriodSelect disabledPeriods={DISABLED_PERIODS} />

        <PriceChangeDisplay priceChange={priceChange} />
      </div>

      <StoreChainMultiSelect
        chains={chains}
        selectedChains={selectedChains}
        onChainsChange={onChainsChange}
        className="w-full sm:w-sm"
      />
    </div>
  );
}
