import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-item-types";

interface IItemAmountControlsProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
}

export default function ItemAmountControls({
  item,
  onUpdate,
}: IItemAmountControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        aria-label="Smanji količinu za 1"
        className="size-8 sm:size-10 shrink-0"
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

      <span className="text-center min-w-8">{item.amount}</span>

      <Button
        size="icon"
        aria-label="Povećaj količinu za 1"
        className="size-8 sm:size-10 shrink-0"
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
  );
}
