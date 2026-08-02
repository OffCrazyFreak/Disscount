"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto } from "@/lib/api/schemas/shopping-list";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type {
  AddToListFormData,
  IProductPricing,
} from "@/app/products/typings/add-to-list";
import { buildShoppingListItemRequest } from "@/app/products/utils/shopping-list-item-request";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { stashModalError } from "@/lib/modal/modal-error-bus";

interface IUseAddToListSubmitProps {
  ean: string;
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
  draftKey,
  product,
  lists,
  pricing,
  clearDraft,
  resetForm,
  onListCreated,
}: IUseAddToListSubmitProps) {
  const router = useRouter();
  const createShoppingListMutation =
    shoppingListService.useCreateShoppingList();
  const addItemMutation = shoppingListService.useAddItemToShoppingList();

  function targetFromList(list: ShoppingListDto) {
    return {
      id: list.id,
      name: list.title,
      // Compared against the value that actually goes on the wire. The backend
      // merges on name, and buildShoppingListItemRequest sends `name ?? ""`, so
      // a null-named product never matched and the toast claimed a new row while
      // the server had bumped an existing one.
      isQuantityIncrease:
        list.items?.some((item) => item.name === (product?.name ?? "")) ??
        false,
    };
  }

  async function resolveTargetList(data: AddToListFormData) {
    if (data.shoppingListId !== "new") {
      const selected = lists.find((list) => list.id === data.shoppingListId);
      return selected
        ? targetFromList(selected)
        : {
            id: data.shoppingListId,
            name: "popis",
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
        toast.error("Odaberi ili stvori popis za kupnju.");
        openModalUrl({ name: "add-to-list", ean });
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
          ? `Količina proizvoda je povećana u "${target.name}"`
          : `Proizvod je dodan u "${target.name}"`,
        {
          classNames: {
            actionButton:
              "bg-primary! text-primary-foreground! hover:bg-primary/90!",
          },
          action: {
            label: "Otvori",
            onClick: () =>
              router.push(`/shopping-lists/${encodeURIComponent(target.id)}`),
          },
        },
      );
    } catch (error) {
      stashModalError(draftKey, error);
      openModalUrl({ name: "add-to-list", ean });
    }
  }

  return {
    onSubmit,
    isSubmitting:
      createShoppingListMutation.isPending || addItemMutation.isPending,
  };
}
