import { useLocale, useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { formatQuantity } from "@/utils/strings";
import { formatPrice } from "@/utils/price";

interface IItemPriceDisplayProps {
  item: ShoppingListItemDto;
  averagePrice?: number;
}

export default function ItemPriceDisplay({
  item,
  averagePrice,
}: IItemPriceDisplayProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  // Average price - from DB for checked items, from API for unchecked items
  const displayPrice = item.isChecked ? item.avgPrice : averagePrice;

  const avgPricePerUnit =
    displayPrice && item.quantity
      ? displayPrice / parseFloat(item.quantity)
      : undefined;

  const approxPrice = t("items.approxPrice", {
    price: displayPrice == null ? "" : formatPrice(displayPrice, locale),
  });

  if (item.quantity && item.unit) {
    return (
      <div className="text-nowrap">
        <div className="flex flex-shrink-0 items-center gap-2 text-gray-700 text-right text-sm sm:text-md">
          <span className="">
            {`${formatQuantity(item.quantity)} ${item.unit}`}
          </span>

          <span>{approxPrice}</span>
        </div>

        <Separator className="mb-1" />

        <div className="text-xs sm:text-sm font-medium text-gray-700 text-center">
          {t("items.pricePerUnit", {
            price:
              avgPricePerUnit === undefined
                ? ""
                : formatPrice(avgPricePerUnit, locale),
            unit: item.unit,
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 text-sm font-medium text-gray-700">
      <span>{approxPrice}</span>
    </div>
  );
}
