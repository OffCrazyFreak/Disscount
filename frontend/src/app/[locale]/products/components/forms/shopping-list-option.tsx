import { ListChecks } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CommandItem } from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/strings";
import { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListOptionProps {
  list: ShoppingListDto;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ShoppingListOption({
  list,
  isSelected,
  onSelect,
}: IShoppingListOptionProps) {
  const t = useTranslations("products");
  const locale = useLocale();

  return (
    <CommandItem value={list.id} keywords={[list.title]} onSelect={onSelect}>
      <ListChecks className={cn("size-4", isSelected && "text-primary")} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate">{list.title}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{list.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {list.updatedAt && (
        <span className="text-gray-500 text-xs">
          {t("listSelector.updatedAt", {
            date: formatDate(list.updatedAt, locale),
          })}
        </span>
      )}

      <span className="ml-auto text-xs text-gray-500">
        {t("listSelector.progress", {
          checked:
            list.items?.reduce(
              (sum, item) => (item.isChecked ? sum + 1 : sum),
              0,
            ) ?? 0,
          total: list.items?.length ?? 0,
        })}
      </span>
    </CommandItem>
  );
}
