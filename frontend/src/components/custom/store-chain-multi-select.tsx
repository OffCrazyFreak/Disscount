import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { storeNamesMap } from "@/constants/name-mappings";

interface StoreChainMultiSelectProps {
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
}: StoreChainMultiSelectProps) {
  return (
    <MultiSelect values={selectedChains} onValuesChange={onChainsChange}>
      <MultiSelectTrigger className={className || "w-full sm:w-sm"}>
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectGroup>
          {chains
            .sort((a, b) => {
              const aName = storeNamesMap[a] || a;
              const bName = storeNamesMap[b] || b;
              return aName.localeCompare(bName);
            })
            .map((chainCode) => (
              <MultiSelectItem key={chainCode} value={chainCode}>
                {storeNamesMap[chainCode] || chainCode}
              </MultiSelectItem>
            ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
}
