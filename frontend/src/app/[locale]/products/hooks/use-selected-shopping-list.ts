"use client";

import { useEffect, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";
import type { AddToListFormData } from "@/app/[locale]/products/typings/add-to-list";

export function useSelectedShoppingList(
  form: UseFormReturn<AddToListFormData>,
  ean: string | undefined,
  enabled: boolean,
  restoredListId: string | null,
  /** The list the modal was opened from, chosen over the most recent one. */
  preferredListId?: string,
) {
  // The first effect run precedes the portal's field, and only a later render retries, unless memoized.
  "use no memo";

  const t = useTranslations("products");
  const { data: shoppingLists = [], isLoading: isLoadingLists } =
    shoppingListService.useGetCurrentUserShoppingLists({ enabled });
  const removeItemMutation = shoppingListService.useDeleteShoppingListItem();

  // Shared with product rows, or their icon would contradict the list the modal preselects.
  const sortedShoppingLists = sortShoppingListsByRecency(shoppingLists);

  const selectedListId = useWatch({
    control: form.control,
    name: "shoppingListId",
  });
  const { data: selectedShoppingList } =
    shoppingListService.useGetShoppingListById(selectedListId);

  const duplicateItem = ean
    ? selectedShoppingList?.items?.find((item) => item.ean === ean)
    : undefined;
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

    const defaultListId =
      sortedShoppingLists.find((list) => list.id === preferredListId)?.id ??
      sortedShoppingLists[0]?.id ??
      "";
    if (current === defaultListId) return;

    form.resetField("shoppingListId", {
      defaultValue: defaultListId,
    });
  }, [sortedShoppingLists, form, restoredListId, preferredListId]);

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
      toast.success(t("addToList.toast.removed"));
    } catch {
      toast.error(t("addToList.toast.removeFailed"));
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
