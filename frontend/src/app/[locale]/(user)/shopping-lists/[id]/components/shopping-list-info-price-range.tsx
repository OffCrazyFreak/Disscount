import { useLocale, useTranslations } from "next-intl";

import { formatPrice } from "@/utils/price";
import ShoppingListPriceRangeSkeleton from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-price-range-skeleton";

interface IShoppingListInfoPriceRangeProps {
  isLoading: boolean;
  hasItems: boolean;
  min: number;
  avg: number;
  max: number;
}

export default function ShoppingListInfoPriceRange({
  isLoading,
  hasItems,
  min,
  avg,
  max,
}: IShoppingListInfoPriceRangeProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  if (isLoading) return <ShoppingListPriceRangeSkeleton />;

  if (!hasItems) return t("emptyValue");

  const range = t.rich("info.priceRange", {
    min: formatPrice(min, locale),
    avg: formatPrice(avg, locale),
    max: formatPrice(max, locale),
    low: (chunks) => <span className="text-green-700">{chunks}</span>,
    mid: (chunks) => <span className="text-gray-700">{chunks}</span>,
    high: (chunks) => <span className="text-red-700">{chunks}</span>,
  });

  return <span className="whitespace-nowrap">{range}</span>;
}
