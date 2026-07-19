import { useState } from "react";
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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShoppingListDto } from "@/lib/api/types";
import { UseFormReturn } from "react-hook-form";
import { AddToListFormData } from "@/app/products/typings/add-to-list";
import ShoppingListTrigger from "@/app/products/components/forms/shopping-list-trigger";
import ShoppingListOption from "@/app/products/components/forms/shopping-list-option";
import CreateListOption from "@/app/products/components/forms/create-list-option";

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

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <FormControl>
                <ShoppingListTrigger
                  open={open}
                  isLoadingLists={isLoadingLists}
                  disabled={disabled}
                  isNewList={field.value === "new"}
                  customListTitle={customListTitle}
                  selectedList={selectedList}
                />
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
                    <CommandGroup heading="Postojeći popisi">
                      {sortedShoppingLists.map((list) => (
                        <ShoppingListOption
                          key={list.id}
                          list={list}
                          isSelected={selectedList?.id === list.id}
                          onSelect={() => {
                            field.onChange(list.id);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </CommandGroup>
                  )}

                  {customListTitle.trim() && (
                    <CommandGroup heading="Novi popis za kupnju">
                      <CreateListOption
                        customListTitle={customListTitle}
                        onSelect={() => {
                          field.onChange("new");
                          setOpen(false);
                        }}
                      />
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
