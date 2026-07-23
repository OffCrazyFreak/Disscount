"use client";

import { useState, useEffect } from "react";
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

export function useAddToListForm(open: boolean, ean: string) {
  const [customListTitle, setCustomListTitle] = useState("");

  const { user } = useUser();
  const draftKey = `add-to-list.${ean}`;

  // Same query key as the product page, so this is a cache hit unless deep-linked.
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;

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

  const selection = useSelectedShoppingList(form, product?.ean, !!user);

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
    customListTitle,
    pricing,
    clearDraft,
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
    setCustomListTitle,
    selectedList: selection.selectedList,
    duplicateItem: selection.duplicateItem,
    isChecked: form.watch("isChecked"),
    ...pricing,
    handleRemoveFromList: selection.removeFromList,
    isRemoving: selection.isRemoving,
    onSubmit,
    isSubmitting,
    restored,
    clearDraft,
  };
}
