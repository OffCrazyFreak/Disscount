import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/(user)/shopping-lists/[id]/typings/shopping-list-item-types";

interface IItemAmountControlsProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  isUpdating: boolean;
}

export default function ItemAmountControls({
  item,
  onUpdate,
  isUpdating,
}: IItemAmountControlsProps) {
  // No spinner here on purpose: the write is optimistic, so the new amount is
  // already rendered and swapping in a loader would flicker on every tap.
  return (
    // The wrapper itself takes pointer events. Leaving it inert and re-enabling
    // only its buttons lost to Button's own disabled:pointer-events-none, which
    // is the higher specificity, so a press on a greyed-out control fell through
    // to the row's link and navigated to the product instead of doing nothing.
    <div
      className="relative z-20 flex items-center gap-2"
      aria-busy={isUpdating}
    >
      <Button
        size="icon"
        aria-label="Smanji količinu za 1"
        className="shrink-0"
        onClick={() =>
          onUpdate({
            isChecked: item.isChecked,
            amount: (item.amount || 1) - 1,
            chainCode: item.chainCode!,
          })
        }
        disabled={(item.amount || 1) <= 1 || item.isChecked}
      >
        <Minus aria-hidden="true" />
      </Button>

      <span className="text-center min-w-8">{item.amount}</span>

      <Button
        size="icon"
        aria-label="Povećaj količinu za 1"
        className="shrink-0"
        onClick={() =>
          onUpdate({
            isChecked: item.isChecked,
            amount: (item.amount || 1) + 1,
            chainCode: item.chainCode!,
          })
        }
        disabled={item.isChecked}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
