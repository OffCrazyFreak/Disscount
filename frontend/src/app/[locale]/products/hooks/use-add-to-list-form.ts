"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import cijeneService from "@/lib/cijene-api";
import {
  AddToListFormData,
  addToListFormSchema,
} from "@/app/[locale]/products/typings/add-to-list";
import { useUser } from "@/context/user-context";
import { useAddToListPrices } from "@/app/[locale]/products/hooks/use-add-to-list-prices";
import { useSelectedShoppingList } from "@/app/[locale]/products/hooks/use-selected-shopping-list";
import { useAddToListSubmit } from "@/app/[locale]/products/hooks/use-add-to-list-submit";
import { useModalError } from "@/hooks/use-modal-error";
import { useFormDraft } from "@/hooks/use-form-draft";
import { getFormDraft } from "@/utils/browser/local-storage";

const EMPTY_FORM_VALUES: AddToListFormData = {
  shoppingListId: "",
  customListTitle: "",
  amount: "1",
  isChecked: false,
  chainCode: null,
};

export function useAddToListForm(
  open: boolean,
  ean: string,
  preferredListId?: string,
) {
  const { user, accountUser } = useUser();
  // Opened from a list, its own draft, so a draft naming another list cannot win.
  const draftKey = preferredListId
    ? `add-to-list.${ean}.${preferredListId}`
    : `add-to-list.${ean}`;

  // Same query key as the product page, so this is a cache hit unless deep-linked.
  const productQuery = cijeneService.useGetProductByEan({ ean });
  const product = productQuery.data;
  // Read once because getFormDraft can evict, which would make a localStorage write part of rendering.
  const [restoredListId] = useState(() => {
    const drafted = getFormDraft(draftKey)?.values.shoppingListId;

    return typeof drafted === "string" ? drafted : null;
  });

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
    preferredListId,
  );
  // useWatch, because the React Compiler skips memoizing any component that reads watch().
  const customListTitle = useWatch({
    control: form.control,
    name: "customListTitle",
  });
  const isChecked = useWatch({ control: form.control, name: "isChecked" });

  function resetForm() {
    selection.resetSelection();
    form.reset(EMPTY_FORM_VALUES);
  }

  // Gated until lists load, so the auto-selected default isn't drafted as a change.
  const { restored, clearDraft } = useFormDraft({
    draftKey,
    form,
    enabled: open && !selection.isLoadingLists,
    validateRestored: ["customListTitle"],
  });

  const pricing = useAddToListPrices(
    product,
    accountUser?.pinnedStores ?? undefined,
    form,
  );

  const { onSubmit, isSubmitting } = useAddToListSubmit({
    ean,
    preferredListId,
    draftKey,
    product,
    lists: selection.sortedShoppingLists,
    pricing,
    clearDraft,
    resetForm,
    onListCreated: (listId) =>
      form.setValue("shoppingListId", listId, { shouldDirty: true }),
  });

  useModalError(open, draftKey, form);

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
    isChecked,
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
