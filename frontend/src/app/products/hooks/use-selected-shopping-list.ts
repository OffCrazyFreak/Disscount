"use client";

import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import { shoppingListQueries } from "@/lib/api/shopping-lists/hooks";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import type { AddToListFormData } from "@/app/products/typings/add-to-list";

export function useSelectedShoppingList(
  form: UseFormReturn<AddToListFormData>,
  ean: string | undefined,
  enabled: boolean,
  restoredListId: string | null,
) {
  const { data: shoppingLists = [], pending: isLoadingLists } = useAuthedQuery({
    ...shoppingListQueries.me(),
    enabled,
  });
  const removeItemMutation = shoppingListService.useDeleteShoppingListItem();

  const sortedShoppingLists = shoppingLists.slice().sort((a, b) => {
    const updatedAtDifference =
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (updatedAtDifference !== 0) return updatedAtDifference;

    const createdAtDifference =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (createdAtDifference !== 0) return createdAtDifference;

    return b.id.localeCompare(a.id);
  });

  const selectedListId = form.watch("shoppingListId");
  const { data: selectedShoppingList } = useAuthedQuery(
    shoppingListQueries.byId(selectedListId),
  );

  const duplicateItem = selectedShoppingList?.items?.find(
    (item) => item.ean === ean,
  );
  const isAutomaticSelectionRef = useRef(true);

  useEffect(() => {
    const current = form.getValues("shoppingListId");
    if (current === restoredListId) {
      isAutomaticSelectionRef.current = false;
    }

    if (!isAutomaticSelectionRef.current && current === "new") {
      return;
    }

    const currentExists = sortedShoppingLists.some(
      (list) => list.id === current,
    );
    if (!isAutomaticSelectionRef.current && currentExists) return;
    isAutomaticSelectionRef.current = true;

    const newestListId = sortedShoppingLists[0]?.id ?? "";
    if (current === newestListId) return;

    form.resetField("shoppingListId", {
      defaultValue: newestListId,
    });
  }, [sortedShoppingLists, form, restoredListId]);

  function selectList(listId: string) {
    isAutomaticSelectionRef.current = false;
    form.setValue("shoppingListId", listId, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function resetSelection() {
    isAutomaticSelectionRef.current = true;
  }

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
    selectList,
    resetSelection,
    removeFromList,
    isRemoving: removeItemMutation.isPending,
  };
}
