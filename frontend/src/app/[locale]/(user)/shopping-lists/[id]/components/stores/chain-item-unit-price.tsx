import { useLocale, useTranslations } from "next-intl";
import { ArrowBigUpDash, ArrowBigDownDash } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/price";
import { priceTone } from "@/app/[locale]/(user)/shopping-lists/[id]/utils/price-tone";

const UNIT_PRICE_TONES = {
  low: "text-green-600 font-bold",
  high: "text-red-700 font-bold",
  neutral: "text-gray-700",
};

interface IChainItemUnitPriceProps {
  price: number;
  isLowestPrice: boolean;
  isHighestPrice: boolean;
}

export default function ChainItemUnitPrice({
  price,
  isLowestPrice,
  isHighestPrice,
}: IChainItemUnitPriceProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  return (
    <span
      className={cn(
        "flex items-start justify-center gap-1",
        priceTone(UNIT_PRICE_TONES, isLowestPrice, isHighestPrice),
      )}
    >
      {formatPrice(price, locale)}
      {isLowestPrice && (
        <>
          <ArrowBigDownDash className="size-5" aria-hidden="true" />
          <span className="sr-only">{t("stores.table.lowestPrice")}</span>
        </>
      )}
      {isHighestPrice && (
        <>
          <ArrowBigUpDash className="size-5" aria-hidden="true" />
          <span className="sr-only">{t("stores.table.highestPrice")}</span>
        </>
      )}
    </span>
  );
}
