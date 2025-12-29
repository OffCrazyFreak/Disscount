import { useState } from "react";
import { Loader2, Plus, ChevronDown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
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
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={formField.control}
      name="shoppingListId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Popis za kupnju</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  className="flex items-center justify-between gap-2"
                  disabled={isLoadingLists || disabled}
                >
                  <div className="flex-1 text-left">
                    {isLoadingLists ? (
                      <div>
                        <Loader2 className="size-5 animate-spin" />
                        <span className="sr-only">Učitavanje...</span>
                      </div>
                    ) : field.value === "new" && customListTitle.trim() ? (
                      <div>
                        {`Stvori novu listu "${customListTitle.trim()}"`}
                      </div>
                    ) : selectedList ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-x-2">
                          <span>{selectedList.title}</span>

                          {selectedList.updatedAt && (
                            <span className="text-gray-500">
                              ({formatDate(selectedList.updatedAt)})
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          {selectedList.items?.reduce(
                            (sum, item) => (item.isChecked ? sum + 1 : sum),
                            0
                          ) ?? 0}
                          /{selectedList.items?.length ?? 0}
                        </div>
                      </div>
                    ) : (
                      "Odaberi listu..."
                    )}
                  </div>

                  <ChevronDown
                    className={cn(
                      "size-6 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </Button>
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-sm max-w-[75dvw]">
              <Command>
                <CommandInput
                  placeholder="Pretraži svoje popise ili stvori novi..."
                  value={customListTitle}
                  onValueChange={setCustomListTitle}
                />
                <CommandList>
                  <CommandEmpty>
                    <p>
                      Počni upisivati naziv da stvoriš svoj prvi popis za kupnju
                      direktno ovdje.
                    </p>
                  </CommandEmpty>

                  {sortedShoppingLists.length > 0 && (
                    <CommandGroup heading="Postojeće liste">
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
                              selectedList?.id === list.id && "text-primary"
                            )}
                          />
                          {list.title}
                          {list.updatedAt && (
                            <span className="text-gray-500">
                              ({formatDate(list.updatedAt)})
                            </span>
                          )}

                          <span className="ml-auto text-xs text-gray-500">
                            {list.items?.reduce(
                              (sum, item) => (item.isChecked ? sum + 1 : sum),
                              0
                            ) ?? 0}
                            /{list.items?.length ?? 0}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {customListTitle.trim() && (
                    <CommandGroup heading="Novi popis za kupnju">
                      <CommandItem
                        value={`new-${customListTitle}`}
                        onSelect={() => {
                          field.onChange("new");
                          setOpen(false);
                        }}
                      >
                        <Plus className="size-4" />
                        Stvori &ldquo;{customListTitle}&rdquo;
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
