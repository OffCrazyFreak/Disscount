"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import cijeneService from "@/lib/cijene-api";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/products/typings/add-to-list";
import { useUser } from "@/context/user-context";
import { useAddToListPrices } from "@/app/products/hooks/use-add-to-list-prices";
import { useSelectedShoppingList } from "@/app/products/hooks/use-selected-shopping-list";
import { useAddToListSubmit } from "@/app/products/hooks/use-add-to-list-submit";
import { takeModalError } from "@/lib/modal/modal-error-bus";
import { applyProblemToForm } from "@/lib/api/problem-details";
import { useFormDraft } from "@/hooks/use-form-draft";
import { getFormDraft } from "@/utils/browser/local-storage";

const EMPTY_FORM_VALUES: AddToListFormData = {
  shoppingListId: "",
  customListTitle: "",
  amount: "1",
  isChecked: false,
  chainCode: null,
};

export function useAddToListForm(open: boolean, ean: string) {
  const { user } = useUser();
  const draftKey = `add-to-list.${ean}`;

  // Same query key as the product page, so this is a cache hit unless deep-linked.
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;
  const draftedListId = getFormDraft(draftKey)?.values.shoppingListId;
  const restoredListId =
    typeof draftedListId === "string" ? draftedListId : null;

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM_VALUES,
  });

  const selection = useSelectedShoppingList(
    form,
    product?.ean,
    !!user,
    restoredListId,
  );
  const customListTitle = form.watch("customListTitle");

  function resetForm() {
    selection.resetSelection();
    form.reset(EMPTY_FORM_VALUES);
  }

  // Gated until lists load, so the auto-selected default isn't drafted as a change.
  const { restored, clearDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && !selection.isLoadingLists,
  });

  const pricing = useAddToListPrices(
    product,
    user?.pinnedStores ?? undefined,
    form,
  );

  const { onSubmit, isSubmitting } = useAddToListSubmit({
    ean,
    draftKey,
    product,
    lists: selection.sortedShoppingLists,
    pricing,
    clearDraft,
    resetForm,
  });

  // A failed optimistic save reopened this modal: surface the server error.
  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error) applyProblemToForm(error, form);
  }, [open, draftKey, form]);

  return {
    form,
    productQuery,
    product,
    isLoadingLists: selection.isLoadingLists,
    sortedShoppingLists: selection.sortedShoppingLists,
    customListTitle,
    selectedList: selection.selectedList,
    selectList: selection.selectList,
    duplicateItem: selection.duplicateItem,
    isChecked: form.watch("isChecked"),
    ...pricing,
    handleRemoveFromList: selection.removeFromList,
    isRemoving: selection.isRemoving,
    onSubmit,
    isSubmitting,
    restored,
    clearDraft,
    resetForm,
  };
}
