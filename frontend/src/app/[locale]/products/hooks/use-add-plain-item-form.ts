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
import { getFormDraft } from "@/utils/browser/local-storage";
import {
  type AddToListFormData,
  addToListFormSchema,
} from "@/app/[locale]/products/typings/add-to-list";
import { useSelectedShoppingList } from "@/app/[locale]/products/hooks/use-selected-shopping-list";
import { MAX_SHOPPING_LIST_ITEM_NAME_LENGTH } from "@/constants/shopping-list";
import { mergesIntoExisting } from "@/app/[locale]/(user)/shopping-lists/utils/item-merge";

const EMPTY_FORM_VALUES: AddToListFormData = {
  shoppingListId: "",
  customListTitle: "",
  amount: "1",
  isChecked: false,
  chainCode: null,
};

const DRAFT_KEY = "add-plain-item";

/** Adds an item no store sells to a list of the user's choice. */
export function useAddPlainItemForm(open: boolean, initialName: string) {
  const t = useTranslations("products");
  const router = useRouter();
  const { user } = useUser();
  // The name can arrive from the URL, which no input maxLength guards.
  const [name, setName] = useState(() =>
    initialName.slice(0, MAX_SHOPPING_LIST_ITEM_NAME_LENGTH),
  );

  const form = useForm<AddToListFormData>({
    resolver: zodResolver(addToListFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM_VALUES,
  });
  // Read once on mount, as add to list does.
  const [restoredListId] = useState(() => {
    const drafted = getFormDraft(DRAFT_KEY)?.values.shoppingListId;

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
  const { clearDraft, flushDraft } = useFormDraft({
    draftKey: DRAFT_KEY,
    form,
    enabled: isFormReady,
  });
  // Same gate: restoring the draft resets the form, which would wipe an error shown earlier.
  useModalError(isFormReady, DRAFT_KEY, form);
  const createListMutation = shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  async function resolveListId(data: AddToListFormData) {
    if (data.shoppingListId !== "new") return data.shoppingListId;

    const created = await createListMutation.mutateAsync({
      title: data.customListTitle.trim(),
    });
    // A failed item add retries into this list instead of creating another one.
    form.setValue("shoppingListId", created.id, { shouldDirty: true });
    flushDraft();
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
    flushDraft();
    closeModalUrl();

    try {
      const listId = await resolveListId(data);
      await addItemMutation.mutateAsync({
        listId,
        data: {
          name: itemName,
          amount: Number.parseInt(data.amount, 10),
          isChecked: false,
        },
      });

      clearDraft();
      toast.success(
        isQuantityIncrease
          ? t("addPlainItem.toast.quantityIncreased", { name: listTitle })
          : t("addPlainItem.toast.added", { name: listTitle }),
        {
          classNames: {
            actionButton:
              "bg-primary! text-primary-foreground! hover:bg-primary/90!",
          },
          action: {
            label: t("addToList.toast.open"),
            onClick: () =>
              router.push(`/shopping-lists/${encodeURIComponent(listId)}`),
          },
        },
      );
    } catch (error) {
      stashModalError(DRAFT_KEY, error);
      openModalUrl({ name: "add-plain-item", itemName });
    }
  }

  return {
    form,
    name,
    setName,
    selection,
    onSubmit,
    isSubmitting: createListMutation.isPending || addItemMutation.isPending,
  };
}
