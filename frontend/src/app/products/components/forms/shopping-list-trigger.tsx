import { ComponentPropsWithoutRef, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/strings";
import { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListTriggerProps extends ComponentPropsWithoutRef<"button"> {
  open: boolean;
  isLoadingLists: boolean;
  isNewList: boolean;
  customListTitle: string;
  selectedList: ShoppingListDto | undefined;
}

// forwardRef and prop spread, so the asChild wiring reaches the Button.
const ShoppingListTrigger = forwardRef<
  HTMLButtonElement,
  IShoppingListTriggerProps
>(function ShoppingListTrigger(
  {
    open,
    isLoadingLists,
    disabled,
    isNewList,
    customListTitle,
    selectedList,
    ...props
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      role="combobox"
      size="default"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={isLoadingLists || disabled}
      {...props}
      className={cn(
        "flex items-center justify-between gap-2 outline-none",
        props.className,
      )}
    >
      <div className="flex-1 text-left w-0">
        {isLoadingLists ? (
          <div>
            <BlockLoadingSpinner size={20} />
            <span className="sr-only">Učitavanje...</span>
          </div>
        ) : isNewList && customListTitle.trim() ? (
          <div className="truncate">
            {`Stvori novi popis "${customListTitle.trim()}"`}
          </div>
        ) : selectedList ? (
          <div className="flex items-center gap-2">
            <span className="truncate">{selectedList.title}</span>

            {selectedList.updatedAt && (
              <span className="text-gray-500 text-xs whitespace-nowrap">
                ({formatDate(selectedList.updatedAt)})
              </span>
            )}

            <span className="ml-auto text-xs text-gray-500">
              {selectedList.items?.reduce(
                (sum, item) => (item.isChecked ? sum + 1 : sum),
                0,
              ) ?? 0}
              /{selectedList.items?.length ?? 0}
            </span>
          </div>
        ) : (
          "Odaberi popis..."
        )}
      </div>

      <ChevronDown
        className={cn(
          "size-6 flex-shrink-0 transition-transform",
          open && "rotate-180",
        )}
      />
    </Button>
  );
});

export default ShoppingListTrigger;
