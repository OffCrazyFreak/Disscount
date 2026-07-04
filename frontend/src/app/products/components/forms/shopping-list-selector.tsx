import { useState } from "react";
import { Loader2, Plus, ChevronDown, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/strings";
import { ShoppingListDto } from "@/lib/api/types";
import { UseFormReturn } from "react-hook-form";
import { AddToListFormData } from "@/app/products/typings/add-to-list";

interface IShoppingListSelectorProps {
  formField: UseFormReturn<AddToListFormData>;
  isLoadingLists: boolean;
  sortedShoppingLists: ShoppingListDto[];
  customListTitle: string;
  setCustomListTitle: (title: string) => void;
  selectedList: ShoppingListDto | undefined;
  disabled?: boolean;
}

export default function ShoppingListSelector({
  formField,
  isLoadingLists,
  sortedShoppingLists,
  customListTitle,
  setCustomListTitle,
  selectedList,
  disabled = false,
}: IShoppingListSelectorProps) {
  const t = useTranslations("addToList");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={formField.control}
      name="shoppingListId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t("listLabel")}</FormLabel>

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
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
                        <Loader2 className="size-5 animate-spin" />
                        <span className="sr-only">{tCommon("loading")}</span>
                      </div>
                    ) : field.value === "new" && customListTitle.trim() ? (
                      <div className="truncate">
                        {t("createNewList", { title: customListTitle.trim() })}
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
                      t("selectPlaceholder")
                    )}
                  </div>

                  <ChevronDown
                    className={cn(
                      "size-6 flex-shrink-0 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </Button>
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-sm max-w-[75dvw]">
              <Command>
                <CommandInput
                  placeholder={t("searchPlaceholder")}
                  value={customListTitle}
                  onValueChange={setCustomListTitle}
                />
                <CommandList>
                  <CommandEmpty>
                    <p>{t("emptyHint")}</p>
                  </CommandEmpty>

                  {sortedShoppingLists.length > 0 && (
                    <CommandGroup heading={t("existingLists")}>
                      {sortedShoppingLists.map((list) => (
                        <CommandItem
                          key={list.id}
                          value={list.id}
                          onSelect={() => {
                            field.onChange(list.id);
                            setOpen(false);
                          }}
                        >
                          <ListChecks
                            className={cn(
                              "size-4",
                              selectedList?.id === list.id && "text-primary",
                            )}
                          />
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
                              ({formatDate(list.updatedAt)})
                            </span>
                          )}

                          <span className="ml-auto text-xs text-gray-500">
                            {list.items?.reduce(
                              (sum, item) => (item.isChecked ? sum + 1 : sum),
                              0,
                            ) ?? 0}
                            /{list.items?.length ?? 0}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {customListTitle.trim() && (
                    <CommandGroup heading={t("newListGroup")}>
                      <CommandItem
                        value={`new-${customListTitle}`}
                        onSelect={() => {
                          field.onChange("new");
                          setOpen(false);
                        }}
                        className="text-nowrap"
                      >
                        <Plus className="size-4" />
                        {tCommon("create")} &ldquo;
                        <span className="truncate">
                          {customListTitle.trim()}
                        </span>
                        &rdquo;
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
