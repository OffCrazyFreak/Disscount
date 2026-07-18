import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import StoreChainSelect from "@/components/custom/store-chain-select";

import type { ShoppingListItemDto } from "@/lib/api/types";
import RemoveItemButton from "./remove-item-button";
import ItemAmountControls from "./item-amount-controls";
import ItemPriceDisplay from "./item-price-display";
import type { IShoppingListItemUpdate } from "./shopping-list-item-types";

interface IShoppingListItemProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  onDelete: () => void;
  isDeleting: boolean;
  cheapestStore?: string;
  averagePrice?: number;
  storePrices: Record<string, number>;
  showSeparator: boolean;
}

export default function ShoppingListItem({
  item,
  onUpdate,
  onDelete,
  isDeleting,
  cheapestStore,
  averagePrice,
  storePrices,
  showSeparator,
}: IShoppingListItemProps) {
  return (
    <>
      <div className="flex items-center justify-between py-1 flex-wrap sm:flex-nowrap gap-6">
        {/* Left side: Checkbox, item name, and delete button (mobile) */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Checkbox
            checked={item.isChecked}
            onCheckedChange={(checked) =>
              onUpdate({
                isChecked: checked as boolean,
                amount: item.amount || 1,
                chainCode: item.chainCode!,
              })
            }
          />
          <div className="flex-1">
            <Link
              href={`/products/${item.ean}`}
              className={`text-sm sm:text-md text-pretty hover:underline hover:text-primary cursor-pointer ${
                item.isChecked ? "line-through text-gray-500" : ""
              }`}
            >
              {item.name}
            </Link>
            {item.brand && (
              <p className="text-xs sm:text-sm text-gray-600 text-pretty">
                {item.brand}
              </p>
            )}
          </div>

          {/* Delete button - shown on mobile in same row as item name */}
          <RemoveItemButton
            visibilityClassName="sm:hidden"
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>

        {/* Right side: Amount controls, price, and remove button */}
        <div className="flex flex-shrink-0 items-center justify-between gap-8 w-full sm:w-auto">
          <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row w-full">
            <div className="flex items-center justify-between gap-6">
              <ItemPriceDisplay item={item} averagePrice={averagePrice} />

              <ItemAmountControls item={item} onUpdate={onUpdate} />
            </div>

            {/* Store Chain Select */}
            <StoreChainSelect
              value={item.chainCode}
              onChange={(chainCode) =>
                onUpdate({
                  isChecked: item.isChecked,
                  amount: item.amount || 1,
                  chainCode,
                })
              }
              disabled={item.isChecked}
              defaultValue={cheapestStore}
              storePrices={storePrices}
              averagePrice={averagePrice}
              isChecked={item.isChecked}
              storePriceFromDb={item.storePrice || undefined}
              classname="w-full sm:w-72 sm:flex-none"
            />
          </div>

          {/* Remove button - hidden on mobile, shown on larger screens */}
          <RemoveItemButton
            visibilityClassName="hidden sm:flex"
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Separator (except for last item) */}
      {showSeparator && <Separator className="my-2" />}
    </>
  );
}
