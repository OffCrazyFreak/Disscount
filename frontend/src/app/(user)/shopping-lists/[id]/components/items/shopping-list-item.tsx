import Link from "next/link";
import { Minus, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import StoreChainSelect from "../../../../../../components/custom/store-chain-select";
import { storeNamesMap } from "@/utils/mappings";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { formatQuantity } from "@/utils/strings";

interface ShoppingListItemProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: {
    isChecked: boolean;
    amount: number;
    chainCode: string | null;
  }) => void;
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
}: ShoppingListItemProps) {
  // Map backend enum (e.g. "PLODINE" or "TRGOVINA_KRK") to our storeNamesMap key
  const chainKey = item.chainCode
    ? item.chainCode.toLowerCase().replace(/_/g, "-")
    : null;
  const storeName = chainKey ? storeNamesMap[chainKey] ?? chainKey : null;

  // Average price - from DB for checked items, from API for unchecked items
  const displayPrice = item.isChecked ? item.avgPrice : averagePrice;

  // Calculate average price per unit
  const avgPricePerUnit =
    displayPrice && item.quantity
      ? displayPrice / parseFloat(item.quantity)
      : undefined;

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
              className={`text-sm sm:text-md hover:underline hover:text-primary cursor-pointer ${
                item.isChecked ? "line-through text-gray-500" : ""
              }`}
            >
              {item.name}
            </Link>
            {item.brand && (
              <p className="text-xs sm:text-sm text-gray-600 text-wrap">
                {item.brand}
              </p>
            )}
          </div>

          {/* Delete button - shown on mobile in same row as item name */}
          <Button
            size="icon"
            variant="default"
            className="size-7 sm:hidden p-2 bg-red-600 hover:bg-red-700"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
          </Button>
        </div>

        {/* Right side: Amount controls, price, and remove button */}
        <div className="flex flex-shrink-0 items-center justify-between gap-8 w-full sm:w-auto">
          <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row w-full">
            <div className="flex items-center justify-between gap-4">
              {item.quantity && item.unit ? (
                <div className="">
                  <div className="flex flex-shrink-0 items-center gap-2 text-gray-700 text-right">
                    <span className="">
                      {`${formatQuantity(item.quantity)} ${item.unit}`}
                    </span>

                    <span>~ {displayPrice?.toFixed(2)}€</span>
                  </div>

                  <Separator className="px-10 mb-1" />

                  <div className="text-sm font-medium text-gray-700 text-center">
                    {avgPricePerUnit?.toFixed(2)}€/{item.unit}
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 text-sm font-medium text-gray-700">
                  <span>~ {displayPrice?.toFixed(2)}€</span>
                </div>
              )}

              {/* Amount controls */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="default"
                  className="size-7 sm:size-10"
                  onClick={() =>
                    onUpdate({
                      isChecked: item.isChecked,
                      amount: (item.amount || 1) - 1,
                      chainCode: item.chainCode!,
                    })
                  }
                  disabled={(item.amount || 1) <= 1 || item.isChecked}
                >
                  <Minus className="size-4 sm:size-5" />
                </Button>

                <span className="w-8 text-center font-medium">
                  {item.amount || 1}
                </span>

                <Button
                  size="icon"
                  variant="default"
                  className="size-7 sm:size-10"
                  onClick={() =>
                    onUpdate({
                      isChecked: item.isChecked,
                      amount: (item.amount || 1) + 1,
                      chainCode: item.chainCode!,
                    })
                  }
                  disabled={item.isChecked}
                >
                  <Plus className="size-4 sm:size-5" />
                </Button>
              </div>
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
          <Button
            size="icon"
            variant="default"
            className="hidden sm:flex size-7 sm:size-10 p-2 bg-red-600 hover:bg-red-700"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 sm:size-5 animate-spin" />
            ) : (
              <X className="size-4 sm:size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Separator (except for last item) */}
      {showSeparator && <Separator className="my-2" />}
    </>
  );
}
