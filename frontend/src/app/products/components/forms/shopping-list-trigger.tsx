import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/strings";
import { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListTriggerProps {
  open: boolean;
  isLoadingLists: boolean;
  disabled: boolean;
  isNewList: boolean;
  customListTitle: string;
  selectedList: ShoppingListDto | undefined;
}

export default function ShoppingListTrigger({
  open,
  isLoadingLists,
  disabled,
  isNewList,
  customListTitle,
  selectedList,
}: IShoppingListTriggerProps) {
  return (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      size="default"
      aria-expanded={open}
      aria-haspopup="listbox"
      className="flex items-center justify-between gap-2 outline-none"
      disabled={isLoadingLists || disabled}
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
}
