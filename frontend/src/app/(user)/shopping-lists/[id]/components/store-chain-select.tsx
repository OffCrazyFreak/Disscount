import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { storeNamesMap, STORE_CHAIN_OPTIONS } from "@/utils/mappings";
import { useEffect, useState } from "react";

interface StoreChainSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string | null;
  storePrices?: Record<string, number>; // chain code -> price
  averagePrice?: number;
  isChecked?: boolean; // Whether the item is checked
  storePriceFromDb?: number; // Store price from database when item is checked
  classname?: string;
}

export default function StoreChainSelect({
  value,
  onChange,
  disabled = false,
  defaultValue,
  storePrices = {},
  averagePrice,
  isChecked = false,
  storePriceFromDb,
  classname,
}: StoreChainSelectProps) {
  const [displayValue, setDisplayValue] = useState<string>(value || "");

  // If default value is provided and current value is null/undefined, use default
  useEffect(() => {
    if (!value && defaultValue && !disabled) {
      setDisplayValue(defaultValue);
      onChange(defaultValue);
    } else if (value) {
      setDisplayValue(value);
    }
  }, [value, defaultValue, onChange, disabled]);

  // Calculate price difference for a store
  const getPriceDifference = (chainCode: string) => {
    // When item is checked, use database prices
    if (isChecked) {
      if (!averagePrice || !storePriceFromDb) return null;
      if (chainCode !== value) return null; // Only show difference for selected store when checked

      const difference = storePriceFromDb - averagePrice;
      const percentage = (difference / averagePrice) * 100;

      return {
        percentage: percentage.toFixed(1),
        absolute: difference.toFixed(2),
      };
    }

    // When item is unchecked, use API prices
    if (!averagePrice || !storePrices[chainCode]) return null;

    const storePrice = storePrices[chainCode];
    const difference = storePrice - averagePrice;
    const percentage = (difference / averagePrice) * 100;

    return {
      percentage: percentage.toFixed(1),
      absolute: difference.toFixed(2),
    };
  };

  return (
    <Select value={displayValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn("min-w-0 h-9 text-xs sm:text-sm", classname)}
      >
        <SelectValue placeholder="Trgovina" />
      </SelectTrigger>

      <SelectContent>
        {STORE_CHAIN_OPTIONS.filter(
          (option) =>
            isChecked
              ? option.code === value // When checked, only show the selected store
              : storePrices[option.code] !== undefined || option.code === value // When unchecked, show available stores and current selection
        ).map((option) => {
          const diff = getPriceDifference(option.code);
          const diffText = diff
            ? ` (${parseFloat(diff.percentage) > 0 ? "+" : ""}${diff.percentage}%, ${parseFloat(diff.absolute) > 0 ? "+" : ""}${diff.absolute}€)`
            : "";

          // Determine color based on difference (positive = red, negative = green)
          const diffColorClass = diff
            ? parseFloat(diff.absolute) > 0
              ? "text-red-600"
              : parseFloat(diff.absolute) < 0
                ? "text-green-600"
                : "text-gray-500"
            : "text-gray-500";

          return (
            <SelectItem key={option.code} value={option.code}>
              <span>{storeNamesMap[option.key] || option.key}</span>
              <span className={`text-xs ${diffColorClass}`}>{diffText}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
