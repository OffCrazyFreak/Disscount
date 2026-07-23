import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";
import { useEffect, useRef, useState } from "react";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";

interface IStoreChainSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string | null;
  storePrices?: Record<string, number>; // chain code -> price
  averagePrice?: number;
  isChecked?: boolean; // Whether the item is checked
  storePriceFromDb?: number; // Store price from database when item is checked
  className?: string;
}

function computePriceDifference(storePrice: number, averagePrice: number) {
  const difference = storePrice - averagePrice;
  const percentage = Math.abs((difference / averagePrice) * 100);

  return {
    percentage: Math.round(percentage).toString(),
    difference: difference.toFixed(2),
  };
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
  className,
}: IStoreChainSelectProps) {
  const [displayValue, setDisplayValue] = useState<string>(value || "");
  const autoSelectedForRef = useRef<string | null>(null);

  // Auto-select the default once per default value. The guard stops a mutation-rollback
  // re-render (value reverts to empty) from re-firing onChange in a request/toast storm.
  useEffect(() => {
    if (
      !value &&
      defaultValue &&
      !disabled &&
      autoSelectedForRef.current !== defaultValue
    ) {
      autoSelectedForRef.current = defaultValue;
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

      return computePriceDifference(storePriceFromDb, averagePrice);
    }

    // When item is unchecked, use API prices
    if (!averagePrice || !storePrices[chainCode]) return null;

    return computePriceDifference(storePrices[chainCode], averagePrice);
  };

  // Build options from the live cijene price data (chain slugs), not a static
  // list, so any chain the API returns is selectable, even unmapped ones.
  // When checked, only the chosen store is shown; otherwise all priced stores
  // plus the current selection.
  const availableChainCodes = (
    isChecked
      ? value
        ? [value]
        : []
      : Array.from(
          new Set([...Object.keys(storePrices), ...(value ? [value] : [])]),
        )
  ).sort((a, b) => compareHr(getChainLabel(a), getChainLabel(b)));

  return (
    <Select value={displayValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn("min-w-0 h-9 text-xs sm:text-sm", className)}
      >
        <SelectValue placeholder="Trgovina" />
      </SelectTrigger>

      <SelectContent>
        {availableChainCodes.map((chainCode) => {
          const priceDifference = getPriceDifference(chainCode);

          // Determine color based on difference (positive = red, negative = green)
          const diffColorClass = priceDifference
            ? parseFloat(priceDifference.difference) > 0
              ? "text-red-700"
              : parseFloat(priceDifference.difference) < 0
                ? "text-green-700"
                : "text-gray-500"
            : "text-gray-500";

          return (
            <SelectItem key={chainCode} value={chainCode}>
              <div className="flex items-center gap-2 w-full">
                <span>{getChainLabel(chainCode)}</span>

                {priceDifference && (
                  <span
                    className={cn(
                      "text-xs flex items-center gap-1",
                      diffColorClass,
                    )}
                  >
                    <span>
                      {parseFloat(priceDifference.difference) > 0 && "+"}
                      {priceDifference.difference}€
                    </span>

                    <span>({priceDifference.percentage}%)</span>

                    {parseFloat(priceDifference.difference) !== 0 &&
                      (parseFloat(priceDifference.difference) < 0 ? (
                        <ArrowBigDownDash
                          className={cn("size-4", diffColorClass)}
                        />
                      ) : (
                        <ArrowBigUpDash
                          className={cn("size-4", diffColorClass)}
                        />
                      ))}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
