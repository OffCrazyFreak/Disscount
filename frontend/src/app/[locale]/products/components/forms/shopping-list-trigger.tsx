import { ComponentPropsWithoutRef, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ShoppingListTriggerLabel from "@/app/[locale]/products/components/forms/shopping-list-trigger-label";
import { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListTriggerProps extends ComponentPropsWithoutRef<"button"> {
  open: boolean;
  isLoadingLists: boolean;
  hasShoppingLists: boolean;
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
    hasShoppingLists,
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
        <ShoppingListTriggerLabel
          isLoadingLists={isLoadingLists}
          hasShoppingLists={hasShoppingLists}
          isNewList={isNewList}
          customListTitle={customListTitle}
          selectedList={selectedList}
        />
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
