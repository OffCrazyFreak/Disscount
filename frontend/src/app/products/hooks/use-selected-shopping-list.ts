"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { AddToListFormData } from "@/app/products/typings/add-to-list";

export function useSelectedShoppingList(
  form: UseFormReturn<AddToListFormData>,
  ean: string | undefined,
  enabled: boolean,
) {
  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists({ enabled });
  const removeItemMutation = shoppingListService.useDeleteShoppingListItem();

  const sortedShoppingLists = shoppingLists
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(selectedListId);

  const duplicateItem = selectedShoppingList?.items?.find(
    (item) => item.ean === ean,
  );

  useEffect(() => {
    const current = form.getValues("shoppingListId");
    if (current === "new") return;

    const needsDefault = current
      ? !sortedShoppingLists.some((list) => list.id === current)
      : sortedShoppingLists.length > 0;
    if (!needsDefault) return;

    form.setValue("shoppingListId", sortedShoppingLists[0]?.id ?? "", {
      shouldValidate: true,
    });
  }, [sortedShoppingLists, form]);

  async function removeFromList() {
    if (!duplicateItem || !selectedListId) return;

    try {
      await removeItemMutation.mutateAsync({
        listId: selectedListId,
        itemId: duplicateItem.id,
      });
      toast.success("Proizvod je uklonjen s popisa.");
    } catch {
      toast.error("Greška pri uklanjanju proizvoda.");
    }
  }

  return {
    sortedShoppingLists,
    isLoadingLists,
    selectedListId,
    selectedList: sortedShoppingLists.find(
      (list) => list.id === selectedListId,
    ),
    duplicateItem,
    removeFromList,
    isRemoving: removeItemMutation.isPending,
  };
}
