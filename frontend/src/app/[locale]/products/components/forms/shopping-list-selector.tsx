import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import ScrollFade from "@/components/custom/common/scroll-fade";
import { ShoppingListDto } from "@/lib/api/types";
import { commandFilter } from "@/utils/search/command-filter";
import { UseFormReturn, useWatch } from "react-hook-form";
import { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";
import ShoppingListTrigger from "@/app/[locale]/products/components/forms/shopping-list-trigger";
import ShoppingListOption from "@/app/[locale]/products/components/forms/shopping-list-option";
import CreateListOption from "@/app/[locale]/products/components/forms/create-list-option";

interface IShoppingListSelectorProps {
  formField: UseFormReturn<AddToListFormData>;
  isLoadingLists: boolean;
  sortedShoppingLists: ShoppingListDto[];
  selectedList: ShoppingListDto | undefined;
  onSelectList: (listId: string) => void;
  disabled?: boolean;
}

export default function ShoppingListSelector({
  formField,
  isLoadingLists,
  sortedShoppingLists,
  selectedList,
  onSelectList,
  disabled = false,
}: IShoppingListSelectorProps) {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const customListTitle = useWatch({
    control: formField.control,
    name: "customListTitle",
  });
  // Local to the popover: only choosing "create" turns it into the form's title,
  // so a search that ends without a choice never reaches the saved draft.
  const [search, setSearch] = useState("");

  function handleOpenChange(isOpen: boolean) {
    if (isOpen)
      setSearch(
        formField.getValues("shoppingListId") === "new" ? customListTitle : "",
      );
    setOpen(isOpen);
  }

  return (
    <FormField
      control={formField.control}
      name="shoppingListId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{t("listSelector.label")}</FormLabel>

          <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
            <PopoverTrigger asChild>
              <FormControl>
                <ShoppingListTrigger
                  open={open}
                  isLoadingLists={isLoadingLists}
                  hasShoppingLists={sortedShoppingLists.length > 0}
                  disabled={disabled}
                  isNewList={field.value === "new"}
                  customListTitle={customListTitle}
                  selectedList={selectedList}
                />
              </FormControl>
            </PopoverTrigger>

            <PopoverContent className="w-sm max-w-[75dvw]">
              <Command filter={commandFilter}>
                <CommandInput
                  placeholder={t("listSelector.searchPlaceholder")}
                  value={search}
                  onValueChange={setSearch}
                />
                {/* List only, so the top fade stays below the search box */}
                <div className="relative flex min-h-0 flex-col">
                  <CommandList ref={listRef} className="scroll-py-10">
                    <CommandEmpty>
                      <p>{t("listSelector.empty")}</p>
                    </CommandEmpty>

                    {sortedShoppingLists.length > 0 && (
                      <CommandGroup heading={t("listSelector.existingLists")}>
                        {sortedShoppingLists.map((list) => (
                          <ShoppingListOption
                            key={list.id}
                            list={list}
                            isSelected={selectedList?.id === list.id}
                            onSelect={() => {
                              // The list goes first: the title rule only applies to "new",
                              // so validating the cleared title before it would flag it.
                              onSelectList(list.id);
                              formField.setValue("customListTitle", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              setOpen(false);
                            }}
                          />
                        ))}
                      </CommandGroup>
                    )}

                    {search.trim() && (
                      <CommandGroup heading={t("listSelector.newList")}>
                        <CreateListOption
                          customListTitle={search}
                          onSelect={() => {
                            // "new" goes first so the title is validated as a new list's.
                            onSelectList("new");
                            formField.setValue("customListTitle", search, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setOpen(false);
                          }}
                        />
                      </CommandGroup>
                    )}
                  </CommandList>

                  <ScrollFade
                    targetRef={listRef}
                    side="top"
                    className="from-popover h-10"
                  />

                  <ScrollFade
                    targetRef={listRef}
                    className="from-popover h-10"
                  />
                </div>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />

          {/* The title has no input of its own (it comes from the create row), so its error shows here; `contents` adds no grid gap while empty. */}
          <FormField
            control={formField.control}
            name="customListTitle"
            render={() => (
              <FormItem className="contents">
                <FormMessage />
              </FormItem>
            )}
          />
        </FormItem>
      )}
    />
  );
}
