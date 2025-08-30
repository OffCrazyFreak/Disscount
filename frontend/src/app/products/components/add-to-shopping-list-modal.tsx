"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Check,
  ChevronDown,
  ListPlus,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
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
import { shoppingListService } from "@/lib/api";
import { ShoppingListRequest } from "@/lib/api/schemas/shopping-list";
import { ShoppingListItemRequest } from "@/lib/api/schemas/shopping-list-item";
import { ProductResponse } from "@/app/products/api/schemas";
import { cn } from "@/utils/generic";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/user-context";
import { formatDate } from "@/utils/strings";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";

interface AddToShoppingListModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse | null;
}

export default function AddToShoppingListModal({
  isOpen,
  onOpenChange,
  product,
}: AddToShoppingListModalProps) {
  const [open, setOpen] = useState(false);
  const [customListTitle, setCustomListTitle] = useState("");

  const queryClient = useQueryClient();
  const { refreshShoppingLists } = useUser();

  const {
    data: shoppingLists = [],
    isLoading: isLoadingLists,
    refetch: refetchShoppingLists,
  } = shoppingListService.useGetCurrentUserShoppingLists();

  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    defaultValues: {
      shoppingListId: "",
      amount: 1,
      isChecked: false,
    },
  });

  // Get selected shopping list details to check for duplicates
  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(
      selectedListId && selectedListId !== "new" ? selectedListId : ""
    );

  // Check for duplicate EAN in selected list
  const duplicateItem = selectedShoppingList?.items?.find(
    (item) => item.ean === product?.ean
  );
  const hasDuplicateEan = !!duplicateItem;

  // Sort shopping lists by updatedAt (newest first) and set default selection
  const sortedShoppingLists = shoppingLists
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  // Set default selection when lists are loaded or when modal opens
  useEffect(() => {
    if (
      isOpen &&
      sortedShoppingLists.length > 0 &&
      !form.getValues("shoppingListId")
    ) {
      form.setValue("shoppingListId", sortedShoppingLists[0].id);
    }
  }, [isOpen, sortedShoppingLists, form]);

  const handleSubmit = async (data: AddToListFormData) => {
    if (!product) return;

    try {
      let listId = data.shoppingListId;

      // If creating a new list, create it first
      if (data.shoppingListId === "new" && customListTitle) {
        const createRequest: ShoppingListRequest = {
          title: customListTitle,
          isPublic: false,
        };

        const newList = await createShoppingListMutation.mutateAsync(
          createRequest
        );
        listId = newList.id;

        toast.success(`Lista "${customListTitle}" je stvorena`);
      }

      // Add item to shopping list
      const itemRequest: ShoppingListItemRequest = {
        ean: product.ean,
        name: product.name || "",
        brand: product.brand || undefined,
        quantity: product.quantity || undefined,
        unit: product.unit || undefined,
        amount: data.amount,
        isChecked: data.isChecked,
      };

      await addItemMutation.mutateAsync({
        listId,
        data: itemRequest,
      });

      await queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      await queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });

      const listName =
        data.shoppingListId === "new"
          ? customListTitle
          : sortedShoppingLists.find((list) => list.id === listId)?.title ||
            "lista";

      toast.success(`Proizvod je dodan u "${listName}"`);

      // Reset form and close modal
      form.reset({
        shoppingListId:
          sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : "",
        amount: 1,
        isChecked: false,
      });
      setCustomListTitle("");
      setOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast.error("Greška pri dodavanju u listu");
    }
  };

  const handleCancel = () => {
    form.reset({
      shoppingListId:
        sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : "",
      amount: 1,
      isChecked: false,
    });
    setCustomListTitle("");
    setOpen(false);
    onOpenChange(false);
  };

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === form.watch("shoppingListId")
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            <DialogTitle>Dodaj proizvod u shopping listu</DialogTitle>
          </DialogTitle>
        </DialogHeader>

        {/* TODO: table with Product Info (ean, prices) */}
        <div className="p-2 bg-gray-200 rounded-lg">
          <h4 className="text-sm text-gray-900">{product.name}</h4>
          {product.brand && (
            <p className="text-sm text-gray-600">{product.brand}</p>
          )}
        </div>

        {/* Warning for duplicate EAN */}
        {hasDuplicateEan && selectedListId !== "new" && duplicateItem && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-4">
              <TriangleAlert className="size-10 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <h4 className="text-sm text-amber-600">
                  Proizvod već u shopping listi
                </h4>
                <p className="text-xs text-amber-900 text-justify">
                  Ovaj proizvod je već dodan u shopping listu "
                  {selectedList?.title}". Dodavanjem ovog proizvoda će se samo
                  povećati njegova količina u shopping listi{" "}
                  {duplicateItem.amount > 1 && ` (${duplicateItem.amount} kom)`}
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="shoppingListId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Shopping lista</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className=""
                          disabled={isLoadingLists}
                        >
                          {isLoadingLists ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Učitavanje...
                            </>
                          ) : field.value === "new" ? (
                            `Stvori novu listu "${customListTitle}"`
                          ) : selectedList ? (
                            <>
                              {selectedList.title}
                              <span className="text-gray-500">
                                ({formatDate(selectedList.updatedAt)})
                              </span>

                              <span className="ml-auto text-xs text-gray-500">
                                {selectedList.items.reduce(
                                  (sum, item) =>
                                    item.isChecked ? sum + 1 : sum,
                                  0
                                )}
                                /{selectedList.items?.length}
                              </span>
                            </>
                          ) : (
                            "Odaberi listu..."
                          )}

                          <ChevronDown
                            className={cn(
                              "ml-2 size-5 shrink-0 transition-transform",
                              open && "rotate-180"
                            )}
                          />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-sm">
                      <Command>
                        <CommandInput
                          placeholder="Pretraži svoje liste ili stvori novu"
                          value={customListTitle}
                          onValueChange={setCustomListTitle}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2">
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => {
                                  field.onChange("new");
                                  setOpen(false);
                                }}
                              >
                                <Plus className="size-4" />
                                Stvori "{customListTitle}"
                              </Button>
                            </div>
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
                                      selectedList?.id === list.id &&
                                        "text-primary"
                                    )}
                                  />
                                  {list.title}
                                  <span className="text-gray-500">
                                    ({formatDate(list.updatedAt)})
                                  </span>

                                  <span className="ml-auto text-xs text-gray-500">
                                    {list.items.reduce(
                                      (sum, item) =>
                                        item.isChecked ? sum + 1 : sum,
                                      0
                                    )}
                                    /{list.items?.length}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}

                          {customListTitle && (
                            <CommandGroup heading="Nova lista">
                              <CommandItem
                                value={`new-${customListTitle}`}
                                onSelect={() => {
                                  field.onChange("new");
                                  setOpen(false);
                                }}
                              >
                                <Plus className="size-4" />
                                Stvori "{customListTitle}"
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

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Količina</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isChecked"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4">
                  <FormControl className="grid place-items-center shadow-md">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Unaprijed označi proizvod kao kupljen</FormLabel>
                    <FormLabel className="text-xs text-gray-500">
                      Ovo je moguće naknadno izmjeniti u shopping listi
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Odustani
              </Button>

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Dodaj
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
