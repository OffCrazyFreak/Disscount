"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useUser } from "@/context/user-context";
import { useRouter } from "@/i18n/navigation";
import { shoppingListService } from "@/lib/api";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { useModalError } from "@/hooks/use-modal-error";
import { useFormDraft } from "@/hooks/use-form-draft";
import {
  getFormDraft,
  removeFormDraft,
  setFormDraft,
} from "@/utils/browser/local-storage";
import {
  type AddToListFormData,
  addToListFormSchema,
} from "@/app/[locale]/products/typings/add-to-list";
import { useSelectedShoppingList } from "@/app/[locale]/products/hooks/use-selected-shopping-list";
import { MAX_SHOPPING_LIST_ITEM_NAME_LENGTH } from "@/constants/shopping-list";
import {
  mergesIntoExisting,
  nameKey,
} from "@/app/[locale]/(user)/shopping-lists/utils/item-merge";

const EMPTY_FORM_VALUES: AddToListFormData = {
  shoppingListId: "",
  customListTitle: "",
  amount: "1",
  isChecked: false,
  chainCode: null,
};

// One draft per item, matched the way items merge, so a list picked for one name never
// preselects itself for another.
function draftKeyFor(itemName: string) {
  return `add-plain-item.${nameKey(itemName)}`;
}

/** Adds an item no store sells to a list of the user's choice. */
export function useAddPlainItemForm(open: boolean, initialName: string) {
  const t = useTranslations("products");
  const router = useRouter();
  const { user } = useUser();
  const draftKey = draftKeyFor(initialName);
  // The name can arrive from the URL, which no input maxLength guards.
  const startName = initialName.slice(0, MAX_SHOPPING_LIST_ITEM_NAME_LENGTH);
  const [name, setName] = useState(startName);

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM_VALUES,
  });
  // Read once on mount, as add to list does.
  const [restoredListId] = useState(() => {
    const drafted = getFormDraft(draftKey)?.values.shoppingListId;

    return typeof drafted === "string" ? drafted : null;
  });
  const selection = useSelectedShoppingList(
    form,
    undefined,
    !!user,
    restoredListId,
  );
  // Gated until lists load, so the auto-selected default isn't drafted as a change.
  const isFormReady = open && !selection.isLoadingLists;
  const { restored, clearDraft, flushDraft } = useFormDraft({
    draftKey,
    form,
    enabled: isFormReady,
  });
  // Same gate: restoring the draft resets the form, which would wipe an error shown earlier.
  useModalError(isFormReady, draftKey, form);
  const createListMutation = shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  function resetForm() {
    clearDraft();
    setName(startName);
    selection.resetSelection();
    form.reset(EMPTY_FORM_VALUES);
  }

  /** A failure reopens the modal for the submitted name, which the user may have edited. */
  function saveDraftFor(itemName: string) {
    flushDraft();
    const submittedKey = draftKeyFor(itemName);
    const draft = getFormDraft(draftKey);
    if (submittedKey === draftKey) return;
    // No draft means the defaults were kept, so an older draft for that name must not win.
    if (draft) setFormDraft(submittedKey, draft.values);
    else removeFormDraft(submittedKey);
  }

  async function resolveListId(data: AddToListFormData, itemName: string) {
    if (data.shoppingListId !== "new") return data.shoppingListId;

    const created = await createListMutation.mutateAsync({
      title: data.customListTitle.trim(),
    });
    // A failed item add retries into this list instead of creating another one.
    form.setValue("shoppingListId", created.id, { shouldDirty: true });
    saveDraftFor(itemName);
    return created.id;
  }

  async function onSubmit(data: AddToListFormData) {
    const itemName = name.trim();
    if (!itemName) return;

    const existingList = selection.selectedList;
    const listTitle =
      data.shoppingListId === "new"
        ? data.customListTitle.trim()
        : (existingList?.title ?? t("addToList.toast.fallbackListName"));
    const isQuantityIncrease =
      data.shoppingListId !== "new" &&
      mergesIntoExisting(existingList?.items, { name: itemName });

    // Optimistic close, as in the add to list modal: an offline add pauses until reconnect.
    // Drafted first, so a failure reopens a fresh form with the same list and amount.
    saveDraftFor(itemName);
    closeModalUrl();

    try {
      const listId = await resolveListId(data, itemName);
      await addItemMutation.mutateAsync({
        listId,
        data: {
          name: itemName,
          amount: Number.parseInt(data.amount, 10),
          isChecked: false,
        },
      });

      clearDraft();
      removeFormDraft(draftKeyFor(itemName));
      toast.success(
        isQuantityIncrease
          ? t("addPlainItem.toast.quantityIncreased", { name: listTitle })
          : t("addPlainItem.toast.added", { name: listTitle }),
        {
          action: {
            label: t("addToList.toast.open"),
            onClick: () =>
              router.push(`/shopping-lists/${encodeURIComponent(listId)}`),
          },
        },
      );
    } catch (error) {
      // Only the submitted name reopens. The close's cleanup flush already ran by now, so
      // this removal is not written back over.
      const submittedKey = draftKeyFor(itemName);
      if (submittedKey !== draftKey) removeFormDraft(draftKey);
      stashModalError(submittedKey, error);
      openModalUrl({ name: "add-plain-item", itemName });
    }
  }

  return {
    form,
    name,
    setName,
    isNameEdited: name !== startName,
    selection,
    restored,
    resetForm,
    onSubmit,
    isSubmitting: createListMutation.isPending || addItemMutation.isPending,
  };
}
