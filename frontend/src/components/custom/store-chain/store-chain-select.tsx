import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/utils/labels";
import { formatPrice } from "@/utils/price";
import { compareHr } from "@/utils/strings";
import { useEffect, useRef, useState } from "react";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface IStoreChainSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string | null;
  storePrices?: Record<string, number>; // chain code -> price
  averagePrice?: number;
  isChecked?: boolean; // Whether the item is checked
  storePriceFromDb?: number; // Store price from database when item is checked
  /** Id of an element saying why this is disabled, when it is. */
  describedById?: string;
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

function diffColorClass(difference: number) {
  if (difference > 0) return "text-red-700";
  if (difference < 0) return "text-green-700";
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
  describedById,
  className,
}: IStoreChainSelectProps) {
  const t = useTranslations("products");
  const locale = useLocale();
  const [displayValue, setDisplayValue] = useState<string>(value || "");
  const autoSelectedForRef = useRef<string | null>(null);

  // The effect is here for onChange, which is a real side effect and cannot move
  // into render. The ref guard is what stops a mutation rollback, where `value`
  // reverts to empty, from re-firing it in a toast storm.
  //
  // The two setDisplayValue branches below are just `value || ""` and could be
  // derived. They are kept so the select shows the auto-selected chain in the same
  // commit as the onChange, rather than blank until the parent echoes the value
  // back. That is the only behavioural difference, and it is worth one directive.
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(value);
    } else {
      setDisplayValue("");
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

  // Built from live price data, so even chains we have not mapped stay selectable.
  // When checked, only the chosen store is offered; otherwise all priced stores plus the current selection.
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
        aria-describedby={describedById}
        className={cn("min-w-0 text-xs sm:text-sm", className)}
      >
        <SelectValue placeholder={t("storeChainField.label")} />
      </SelectTrigger>

      <SelectContent>
        {availableChainCodes.map((chainCode) => {
          const priceDifference = getPriceDifference(chainCode);

          // Positive = red, negative = green
          const differenceValue = priceDifference
            ? parseFloat(priceDifference.difference)
            : 0;
          const colorClass = diffColorClass(differenceValue);
          const differenceLabel =
            differenceValue > 0
              ? t("price.increase", {
                  amount: formatPrice(differenceValue, locale),
                })
              : formatPrice(differenceValue, locale);

          return (
            <SelectItem key={chainCode} value={chainCode}>
              <div className="flex items-center gap-2 w-full">
                <span lang="hr">{getChainLabel(chainCode)}</span>

                {priceDifference && (
                  <span
                    className={cn(
                      "text-xs flex items-center gap-1",
                      colorClass,
                    )}
                  >
                    <span>{differenceLabel}</span>

                    <span>
                      {t("price.percentage", {
                        percentage: priceDifference.percentage,
                      })}
                    </span>

                    {differenceValue !== 0 &&
                      (differenceValue < 0 ? (
                        <ArrowBigDownDash
                          className={cn("size-4", colorClass)}
                        />
                      ) : (
                        <ArrowBigUpDash className={cn("size-4", colorClass)} />
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
