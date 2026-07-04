import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { storeNamesMap } from "@/constants/name-mappings";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";

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

// Positive difference (more expensive than average) is red, negative (cheaper)
// is green. Kept at module scope so the class names live in plain JS.
function getDiffColorClass(difference: string | null): string {
  if (difference === null) return "text-gray-500";

  const value = parseFloat(difference);
  if (value > 0) return "text-red-700";
  if (value < 0) return "text-green-700";

  return "text-gray-500";
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
  const t = useTranslations("common");
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
      const percentage = Math.abs((difference / averagePrice) * 100);

      return {
        percentage: Math.round(percentage).toString(),
        difference: difference.toFixed(2),
      };
    }

    // When item is unchecked, use API prices
    if (!averagePrice || !storePrices[chainCode]) return null;

    const storePrice = storePrices[chainCode];
    const difference = storePrice - averagePrice;
    const percentage = Math.abs((difference / averagePrice) * 100);

    return {
      percentage: Math.round(percentage).toString(),
      difference: difference.toFixed(2),
    };
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
  ).sort((a, b) =>
    (storeNamesMap[a] || a).localeCompare(storeNamesMap[b] || b, "hr", {
      sensitivity: "base",
    }),
  );

  return (
    <Select value={displayValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn("min-w-0 h-9 text-xs sm:text-sm", classname)}
      >
        <SelectValue placeholder={t("storeChainPlaceholder")} />
      </SelectTrigger>

      <SelectContent>
        {availableChainCodes.map((chainCode) => {
          const priceDifference = getPriceDifference(chainCode);
          const diffColorClass = getDiffColorClass(
            priceDifference?.difference ?? null,
          );

          return (
            <SelectItem key={chainCode} value={chainCode}>
              <div className="flex items-center gap-2 w-full">
                <span>{storeNamesMap[chainCode] || chainCode}</span>

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
