"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { shoppingListService } from "@/lib/api";
import { ShoppingListRequest } from "@/lib/api/schemas/shopping-list";
import { ShoppingListItemRequest } from "@/lib/api/schemas/shopping-list-item";
import { ProductResponse } from "@/app/products/api/schemas";
import { useQueryClient } from "@tanstack/react-query";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";
import ProductInfoDisplay from "@/app/products/components/product-info-display";
import DuplicateWarning from "@/app/products/components/forms/duplicate-warning";
import ShoppingListSelector from "@/app/products/components/forms/shopping-list-selector";
import QuantityInput from "@/app/products/components/forms/quantity-input";
import MarkAsCheckedCheckbox from "@/app/products/components/forms/mark-as-checked-checkbox";
import { Button } from "@/components/ui/button";

interface AddToShoppingListFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse | null;
}

export default function AddToShoppingListForm({
  isOpen,
  onOpenChange,
  product,
}: AddToShoppingListFormProps) {
  const [open, setOpen] = useState(false);
  const [customListTitle, setCustomListTitle] = useState("");

  const queryClient = useQueryClient();

  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists();

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

  async function handleSubmit(data: AddToListFormData) {
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
  }

  function handleCancel() {
    form.reset({
      shoppingListId:
        sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : "",
      amount: 1,
      isChecked: false,
    });
    setCustomListTitle("");
    setOpen(false);
    onOpenChange(false);
  }

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === form.watch("shoppingListId")
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  if (!product) return "Product not found";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            <DialogTitle>Dodaj proizvod u shopping listu</DialogTitle>
          </DialogTitle>
        </DialogHeader>

        {/* Product Information Display */}
        <ProductInfoDisplay product={product} />

        {/* Warning for duplicate EAN */}
        <DuplicateWarning
          hasDuplicateEan={hasDuplicateEan}
          selectedListId={selectedListId}
          duplicateItem={duplicateItem}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <ShoppingListSelector
              field={form}
              isLoadingLists={isLoadingLists}
              sortedShoppingLists={sortedShoppingLists}
              customListTitle={customListTitle}
              setCustomListTitle={setCustomListTitle}
              selectedList={selectedList}
            />

            <QuantityInput field={form} />

            <MarkAsCheckedCheckbox field={form} />

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
