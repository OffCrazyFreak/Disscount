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
import { suggestedChain } from "@/components/custom/store-chain/suggested-chain";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface IStoreChainSelectProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string | null;
  storePrices?: Record<string, number>;
  averagePrice?: number;
  isChecked?: boolean;
  storePriceFromDb?: number;
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
  // Shown as the placeholder, outside `value`, so picking that same chain counts as a change.
  const suggested = suggestedChain(value, isChecked, defaultValue);

  const getPriceDifference = (chainCode: string) => {
    if (isChecked) {
      if (!averagePrice || !storePriceFromDb) return null;
      if (chainCode !== value) return null;

      return computePriceDifference(storePriceFromDb, averagePrice);
    }

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
            suggested ? (
              <span lang="hr">{getChainLabel(suggested)}</span>
            ) : (
              t("storeChainField.label")
            )
          }
        />
      </SelectTrigger>

      <SelectContent>
        {chainCodes.map((chainCode) => {
          const priceDifference = getPriceDifference(chainCode);

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
