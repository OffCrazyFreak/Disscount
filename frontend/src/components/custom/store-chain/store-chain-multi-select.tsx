import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

interface IStoreChainMultiSelectProps {
  chains: string[];
  selectedChains: string[];
  onChainsChange: (chains: string[]) => void;
  className?: string;
  placeholder?: string;
}

export default function StoreChainMultiSelect({
  chains,
  selectedChains,
  onChainsChange,
  className,
  placeholder = "Odaberi trgovinske lance...",
}: IStoreChainMultiSelectProps) {
  return (
    <MultiSelect values={selectedChains} onValuesChange={onChainsChange}>
      <MultiSelectTrigger className={className || "w-full sm:w-sm"}>
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectGroup>
          {[...chains]
            .sort((a, b) => compareHr(getChainLabel(a), getChainLabel(b)))
            .map((chainCode) => (
              <MultiSelectItem key={chainCode} value={chainCode}>
                {getChainLabel(chainCode)}
              </MultiSelectItem>
            ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
}
