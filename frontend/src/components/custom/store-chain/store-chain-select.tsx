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
import { availableChainCodes } from "@/components/custom/store-chain/store-chain-codes";
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
  // The default is only shown, as the placeholder, never saved: viewing a list must
  // not write to it, and an unsaved default keeps following whichever chain is cheapest
  // today. Keeping it out of `value` also lets picking that same chain count as a change.
  // A ticked item records where it was bought, so it never borrows a default.
  const suggestedChain = !value && !isChecked ? defaultValue : null;

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

  const chainCodes = availableChainCodes(isChecked, value, storePrices);

  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-describedby={describedById}
        className={cn("min-w-0 text-xs sm:text-sm", className)}
      >
        <SelectValue
          placeholder={
            suggestedChain ? (
              <span lang="hr">{getChainLabel(suggestedChain)}</span>
            ) : (
              t("storeChainField.label")
            )
          }
        />
      </SelectTrigger>

      <SelectContent>
        {chainCodes.map((chainCode) => {
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
