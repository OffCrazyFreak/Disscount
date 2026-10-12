import { useLocale, useTranslations } from "next-intl";
import { PriceExtreme } from "@/app/[locale]/products/utils/product-utils";
import { formatPrice } from "@/utils/price";

interface IStoreCardPriceStatProps {
  label: string;
  price: number;
  extreme: PriceExtreme;
}

function extremeClass(extreme: PriceExtreme): string {
  return extreme === "min"
    ? "text-green-600 font-bold"
    : extreme === "max"
      ? "text-red-700 font-bold"
      : "text-gray-700";
}

// Colour alone would leave the extreme unreadable to screen readers and in greyscale.
function extremeLabelKey(
  extreme: PriceExtreme,
): "stores.lowestAmongChains" | "stores.highestAmongChains" | null {
  return extreme === "min"
    ? "stores.lowestAmongChains"
    : extreme === "max"
      ? "stores.highestAmongChains"
      : null;
}

/** One labelled price in a store card's Min / Prosjek / Max row. */
export default function StoreCardPriceStat({
  label,
  price,
  extreme,
}: IStoreCardPriceStatProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();
  const descriptionKey = extremeLabelKey(extreme);

  return (
    <span className={extremeClass(extreme)}>
      {t("stores.stat", { label, price: formatPrice(price, locale) })}
      {descriptionKey && <span className="sr-only"> {t(descriptionKey)}</span>}
    </span>
  );
}
