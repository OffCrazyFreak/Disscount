"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto } from "@/lib/api/schemas/shopping-list";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  AddToListFormData,
  IProductPricing,
} from "@/app/[locale]/products/typings/add-to-list";
import { buildShoppingListItemRequest } from "@/app/[locale]/products/utils/shopping-list-item-request";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { mergesIntoExisting } from "@/app/[locale]/(user)/shopping-lists/utils/item-merge";
import { stashModalError } from "@/lib/modal/modal-error-bus";

interface IUseAddToListSubmitProps {
  ean: string;
  /** The list the modal was opened from, kept when a failure reopens it. */
  preferredListId?: string;
  draftKey: string;
  product: ProductResponse | undefined;
  lists: ShoppingListDto[];
  pricing: IProductPricing;
  clearDraft: () => void;
  resetForm: () => void;
  /** Points the form at a list that now exists, so a retry cannot create another. */
  onListCreated: (listId: string) => void;
}

export function useAddToListSubmit({
  ean,
  preferredListId,
  draftKey,
  product,
  lists,
  pricing,
  clearDraft,
  resetForm,
  onListCreated,
}: IUseAddToListSubmitProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  function targetFromList(list: ShoppingListDto) {
    return {
      id: list.id,
      name: list.title,
      // Compared against the values that actually go on the wire:
      // buildShoppingListItemRequest sends `name ?? ""`.
      isQuantityIncrease: mergesIntoExisting(list.items, {
        ean: product?.ean,
        name: product?.name ?? "",
      }),
    };
  }

  async function resolveTargetList(data: AddToListFormData) {
    if (data.shoppingListId !== "new") {
      const selected = lists.find((list) => list.id === data.shoppingListId);
      return selected
        ? targetFromList(selected)
        : {
            id: data.shoppingListId,
            name: t("addToList.toast.fallbackListName"),
            isQuantityIncrease: false,
          };
    }

    const title = data.customListTitle.trim();

    // A legacy draft can restore "new" with no title. Falling through to the
    // newest existing list silently filed the product somewhere the user never
    // chose, so refuse instead and let the caller surface it.
    if (!title) return null;

    const created = await createShoppingListMutation.mutateAsync({ title });

    // Recorded before the item is added. If that add fails the modal reopens
    // from the draft, and leaving "new" selected made every retry create another
    // empty list before retrying the item.
    onListCreated(created.id);

    return { id: created.id, name: title, isQuantityIncrease: false };
  }

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: AddToListFormData) {
    if (!product) return;
    closeModalUrl();

    try {
      const target = await resolveTargetList(data);

      if (!target) {
        toast.error(t("addToList.toast.pickList"));
        openModalUrl({ name: "add-to-list", ean, listId: preferredListId });
        return;
      }

      await addItemMutation.mutateAsync({
        listId: target.id,
        data: buildShoppingListItemRequest(product, data, pricing),
      });

      clearDraft();
      resetForm();
      toast.success(
        target.isQuantityIncrease
          ? t("addToList.toast.quantityIncreased", { name: target.name })
          : t("addToList.toast.added", { name: target.name }),
        {
          action: {
            label: t("addToList.toast.open"),
            onClick: () =>
              router.push(`/shopping-lists/${encodeURIComponent(target.id)}`),
          },
        },
      );
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({ name: "add-to-list", ean, listId: preferredListId });
    }
  }

  return {
    onSubmit,
    isSubmitting:
      createShoppingListMutation.isPending || addItemMutation.isPending,
  };
}
