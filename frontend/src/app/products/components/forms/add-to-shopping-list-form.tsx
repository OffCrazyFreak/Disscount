"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
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
import { ProductResponse } from "@/lib/cijene-api/schemas";
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

interface IAddToShoppingListFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse;
}

export default function AddToShoppingListForm({
  isOpen,
  onOpenChange,
  product,
}: IAddToShoppingListFormProps) {
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

  function onSubmit(data: AddToListFormData) {
    if (!product) return;

    const proceedToAdd = (listId: string) => {
      const itemRequest: ShoppingListItemRequest = {
        ean: product.ean,
        name: product.name || "",
        brand: product.brand || undefined,
        quantity: product.quantity || undefined,
        unit: product.unit || undefined,
        amount: data.amount,
        isChecked: data.isChecked,
      };

      addItemMutation.mutate(
        {
          listId,
          data: itemRequest,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
            queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });

            const listName =
              data.shoppingListId === "new"
                ? customListTitle
                : sortedShoppingLists.find((list) => list.id === listId)
                    ?.title || "popis";

            toast.success(`Proizvod je dodan u "${listName}"`);

            // Reset form and close modal
            form.reset({
              shoppingListId:
                sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : "",
              amount: 1,
              isChecked: false,
            });
            setCustomListTitle("");

            onOpenChange(false);
          },
          onError: (err) => {
            toast.error("Greška pri dodavanju na popis: " + err.message);
          },
        }
      );
    };

    // If creating a new list, create it first, then add the item in onSuccess
    if (data.shoppingListId === "new" && customListTitle) {
      const createRequest: ShoppingListRequest = {
        title: customListTitle,
        isPublic: false,
      };

      createShoppingListMutation.mutate(createRequest, {
        onSuccess: (newList) => {
          toast.success(`Popis za kupnju "${customListTitle}" je stvoren`);
          proceedToAdd(newList.id);
        },
        onError: (err) => {
          toast.error("Greška pri stvaranju popisa za kupnju: " + err.message);
        },
      });
    } else {
      proceedToAdd(data.shoppingListId);
    }
  }

  function handleCancel() {
    form.reset();
    setCustomListTitle("");
    onOpenChange(false);
  }

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === form.watch("shoppingListId")
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="add-to-shopping-list-form">
        <DialogHeader>
          <DialogTitle className="text-xl mb-2">
            Dodaj proizvod u popis za kupnju
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ShoppingListSelector
              formField={form}
              isLoadingLists={isLoadingLists}
              sortedShoppingLists={sortedShoppingLists}
              customListTitle={customListTitle}
              setCustomListTitle={setCustomListTitle}
              selectedList={selectedList}
            />

            <QuantityInput formField={form} />

            <MarkAsCheckedCheckbox formField={form} />

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                effect="ringHover"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Odustani
              </Button>

              <Button
                type="submit"
                variant="default"
                effect="expandIcon"
                icon={Save}
                iconPlacement="right"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Dodavanje"
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
