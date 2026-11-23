import { useLocale, useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { formatQuantity } from "@/utils/strings";
import { formatPrice } from "@/utils/price";
import PriceSkeleton from "@/features/shopping-lists/detail/components/items/price-skeleton";
import PlainItemPriceInput from "@/features/shopping-lists/detail/components/items/plain-item/plain-item-price-input";
import type { IShoppingListItemUpdate } from "@/features/shopping-lists/detail/typings/shopping-list-item-types";

interface IItemPriceDisplayProps {
  item: ShoppingListItemDto;
  averagePrice?: number;
  isPriceLoading: boolean;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canCheck: boolean;
}

export default function ItemPriceDisplay({
  item,
  averagePrice,
  isPriceLoading,
  onUpdate,
  canCheck,
}: IItemPriceDisplayProps) {
  const t = useTranslations("shoppingListDetail");
  const locale = useLocale();

  if (!item.ean) {
    return (
      <PlainItemPriceInput
        // Remounted when the saved price changes, so a price saved elsewhere replaces the typed text.
        key={item.storePrice ?? "none"}
        item={item}
        onUpdate={onUpdate}
        canCheck={canCheck}
      />
    );
  }

  // Checked items show the price stored in the database; unchecked ones show the live API price.
  const displayPrice = item.isChecked ? item.avgPrice : averagePrice;

  const avgPricePerUnit =
    displayPrice && item.quantity
      ? displayPrice / parseFloat(item.quantity)
      : undefined;

  // An item with no price shows nothing here; its store select says why.
  const approxPrice = isPriceLoading ? (
    <PriceSkeleton />
  ) : (
    displayPrice != null &&
    t("items.approxPrice", { price: formatPrice(displayPrice, locale) })
  );

  if (item.quantity && item.unit) {
    return (
      <div className="text-nowrap">
        <div className="flex flex-shrink-0 items-center gap-2 text-gray-700 text-right text-sm sm:text-md">
          <span>{`${formatQuantity(item.quantity)} ${item.unit}`}</span>

          <div>{approxPrice}</div>
        </div>

        <Separator className="mb-1" />

        <div className="text-xs sm:text-sm font-medium text-gray-700 text-center">
          {isPriceLoading ? (
            <PriceSkeleton />
          ) : (
            avgPricePerUnit !== undefined &&
            t("items.pricePerUnit", {
              price: formatPrice(avgPricePerUnit, locale),
              unit: item.unit,
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 text-sm font-medium text-gray-700">
      <div>{approxPrice}</div>
    </div>
  );
}
