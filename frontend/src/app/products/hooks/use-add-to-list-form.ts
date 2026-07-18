"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { shoppingListService } from "@/lib/api";
import cijeneService from "@/lib/cijene-api";
import {
  ShoppingListItemDto,
  ShoppingListItemRequest,
} from "@/lib/api/schemas/shopping-list-item";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";
import { useUser } from "@/context/user-context";
import { useAddToListPrices } from "@/app/products/hooks/use-add-to-list-prices";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { stashModalError, takeModalError } from "@/lib/modal/modal-error-bus";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { useFormDraft } from "@/hooks/use-form-draft";

export function useAddToListForm(open: boolean, ean: string) {
  const [customListTitle, setCustomListTitle] = useState("");

  const queryClient = useQueryClient();
  const { user } = useUser();
  const draftKey = `add-to-list.${ean}`;

  // Same query key/staleTime as the product page, so this is a cache hit
  // everywhere except cold deep links.
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;

  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists({ enabled: !!user });

  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();
  const removeItemMutation = shoppingListService.useDeleteShoppingListItem();

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    mode: "onChange",
    defaultValues: {
      shoppingListId: "",
      amount: "1",
      isChecked: false,
      chainCode: null,
    },
  });

  // Persist the user's choices (list, amount, store) so closing and reopening
  // resumes where they left off; gated until lists load so the auto-selected
  // default doesn't count as a change.
  const { restored, clearDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && !isLoadingLists,
  });

  const { storePrices, averagePrice, cheapestStore } = useAddToListPrices(
    product,
    user?.pinnedStores ?? undefined,
    form
  );

  // Get selected shopping list details to check for duplicates
  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(selectedListId);

  const duplicateItem: ShoppingListItemDto | undefined =
    selectedShoppingList?.items?.find((item) => item.ean === product?.ean);

  const sortedShoppingLists = shoppingLists
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  // Default to the most recently updated list once lists load
  useEffect(() => {
    if (sortedShoppingLists.length > 0 && !form.getValues("shoppingListId")) {
      form.setValue("shoppingListId", sortedShoppingLists[0].id);
    }
  }, [sortedShoppingLists, form]);

  // Reset selection if the selected list was deleted
  useEffect(() => {
    const currentSelectedId = form.getValues("shoppingListId");
    if (
      currentSelectedId &&
      currentSelectedId !== "new" &&
      !sortedShoppingLists.find((list) => list.id === currentSelectedId)
    ) {
      form.setValue(
        "shoppingListId",
        sortedShoppingLists.length > 0 ? sortedShoppingLists[0].id : ""
      );
    }
  }, [sortedShoppingLists, form]);

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form.setError);
  }, [open, draftKey, form]);

  const isChecked = form.watch("isChecked");

  // Remove the product from the selected list (the red X shown when it's
  // already there); stays in the modal so the user can re-add or pick another list.
  async function handleRemoveFromList() {
    if (!duplicateItem || !selectedListId) return;
    try {
      await removeItemMutation.mutateAsync({
        listId: selectedListId,
        itemId: duplicateItem.id,
      });
      queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });
      toast.success("Proizvod je uklonjen s popisa.");
    } catch {
      toast.error("Greška pri uklanjanju proizvoda.");
    }
  }

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: AddToListFormData) {
    if (!product) return;
    closeModalUrl();

    try {
      let listId = data.shoppingListId;
      let listName =
        sortedShoppingLists.find((list) => list.id === listId)?.title ||
        "popis";

      if (data.shoppingListId === "new" && customListTitle) {
        const newList = await createShoppingListMutation.mutateAsync({
          title: customListTitle,
          isPublic: false,
        });
        toast.success(`Popis za kupnju "${customListTitle}" je stvoren`);
        listId = newList.id;
        listName = customListTitle;
      }

      const itemRequest: ShoppingListItemRequest = {
        ean: product.ean,
        name: product.name || "",
        brand: product.brand || undefined,
        quantity: product.quantity || undefined,
        unit: product.unit || undefined,
        amount: Number.parseInt(data.amount, 10),
        isChecked: data.isChecked,
      };

      // Only checked items carry price/store info
      if (data.isChecked) {
        const selectedChainCode = data.chainCode || cheapestStore;
        if (selectedChainCode) {
          itemRequest.chainCode = selectedChainCode;
          itemRequest.avgPrice = averagePrice || undefined;
          itemRequest.storePrice = storePrices[selectedChainCode];
        }
      }

      await addItemMutation.mutateAsync({ listId, data: itemRequest });

      queryClient.invalidateQueries({ queryKey: ["shoppingLists"] });
      queryClient.invalidateQueries({ queryKey: ["shoppingListItems"] });
      clearDraft();
      toast.success(`Proizvod je dodan u "${listName}"`);
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({ name: "add-to-list", ean });
    }
  }

  const selectedList = sortedShoppingLists.find(
    (list) => list.id === selectedListId
  );

  const isSubmitting =
    createShoppingListMutation.isPending || addItemMutation.isPending;

  return {
    form,
    productQuery,
    product,
    isLoadingLists,
    sortedShoppingLists,
    customListTitle,
    setCustomListTitle,
    selectedList,
    duplicateItem,
    isChecked,
    storePrices,
    averagePrice,
    cheapestStore,
    handleRemoveFromList,
    isRemoving: removeItemMutation.isPending,
    onSubmit,
    isSubmitting,
    restored,
    clearDraft,
  };
}
