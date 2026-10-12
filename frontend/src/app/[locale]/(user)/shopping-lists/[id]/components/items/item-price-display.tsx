import { Separator } from "@/components/ui/separator";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { formatQuantity } from "@/utils/strings";

interface IItemPriceDisplayProps {
  item: ShoppingListItemDto;
  averagePrice?: number;
}

export default function ItemPriceDisplay({
  item,
  averagePrice,
}: IItemPriceDisplayProps) {
  // Average price - from DB for checked items, from API for unchecked items
  const displayPrice = item.isChecked ? item.avgPrice : averagePrice;

  const avgPricePerUnit =
    displayPrice && item.quantity
      ? displayPrice / parseFloat(item.quantity)
      : undefined;

  if (item.quantity && item.unit) {
    return (
      <div className="text-nowrap">
        <div className="flex flex-shrink-0 items-center gap-2 text-gray-700 text-right text-sm sm:text-md">
          <span className="">
            {`${formatQuantity(item.quantity)} ${item.unit}`}
          </span>

          <span>~ {displayPrice?.toFixed(2)}€</span>
        </div>

        <Separator className="mb-1" />

        <div className="text-xs sm:text-sm font-medium text-gray-700 text-center">
          {avgPricePerUnit?.toFixed(2)}€/{item.unit}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 text-sm font-medium text-gray-700">
      <span>~ {displayPrice?.toFixed(2)}€</span>
    </div>
  );
}
