import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShoppingListItemDto } from "@/lib/api/types";
import type { IShoppingListItemUpdate } from "@/app/(user)/shopping-lists/[id]/typings/shopping-list-item-types";

interface IItemAmountControlsProps {
  item: ShoppingListItemDto;
  onUpdate: (updatedItem: IShoppingListItemUpdate) => void;
  canEdit: boolean;
}

export default function ItemAmountControls({
  item,
  onUpdate,
  canEdit,
}: IItemAmountControlsProps) {
  // The amount is information, not just a control, so a read-only visitor still sees it.
  // Only the buttons go away, rather than sitting there permanently disabled.
  if (!canEdit) {
    return (
      <span className="relative z-20 text-center min-w-8">
        <span className="sr-only">Količina: </span>
        {item.amount}
      </span>
    );
  }

  return (
    // The wrapper itself takes pointer events. Leaving it inert and re-enabling
    // only its buttons lost to Button's own disabled:pointer-events-none, which
    // is the higher specificity, so a press on a greyed-out control fell through
    // to the row's link and navigated to the product instead of doing nothing.
    <div className="relative z-20 flex items-center gap-2">
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
