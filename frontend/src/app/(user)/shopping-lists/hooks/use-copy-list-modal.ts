"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type {
  ShoppingListItemRequest,
  ShoppingListRequest,
} from "@/lib/api/types";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { shoppingListPath } from "@/utils/shopping-list-links";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

export interface ICopyListOptions {
  items: boolean;
  progress: boolean;
  sharing: boolean;
}

/**
 * What a copy carries. Products are on because a copy without them is just a title;
 * everything else is off, since the common reason to copy is "same shop, next week" and
 * last week's ticks and prices would make the copy wrong on arrival.
 */
const DEFAULT_OPTIONS: ICopyListOptions = {
  items: true,
  progress: false,
  sharing: false,
};

export function useCopyListModal(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [options, setOptions] = useState<ICopyListOptions>(DEFAULT_OPTIONS);
  const [isCopying, setIsCopying] = useState(false);

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const shoppingList = listQuery.data ?? null;

  // Only an owner may carry the sharing settings over, or a recipient could copy a list
  // and hand the owner's link out at a level the owner never chose to give them.
  const canCopySharing = resolveShoppingListAccess(
    shoppingList?.myAccess,
  ).canManageShare;

  function setOption(key: keyof ICopyListOptions, value: boolean) {
    setOptions((previous) => ({ ...previous, [key]: value }));
  }

  async function copyList() {
    if (!shoppingList || isCopying) return;

    setIsCopying(true);
    try {
      const request: ShoppingListRequest = {
        title: `${shoppingList.title} (Kopija)`,
        // Only when asked and only when allowed. The server refuses linkAccess from a
        // non-owner anyway, so this keeps the request honest rather than being the guard.
        ...(options.sharing && canCopySharing && shoppingList.linkAccess
          ? { linkAccess: shoppingList.linkAccess }
          : {}),
      };

      const copy = await shoppingListService.createShoppingList(request);

      // allSettled, not all: the list is already created by this point, so a rejected
      // item cannot un-create it. Failing the whole thing would report an error while a
      // partial copy sits on the server, which is worse than saying what happened. There
      // is no server-side copy endpoint to make this one transaction.
      let failedItems = 0;
      if (options.items && shoppingList.items.length > 0) {
        const results = await Promise.allSettled(
          shoppingList.items.map((item) => {
            const data: ShoppingListItemRequest = {
              ean: item.ean,
              name: item.name,
              brand: item.brand,
              quantity: item.quantity,
              unit: item.unit,
              amount: item.amount,
              // Where "progress" lands: what was ticked, the shop it was ticked at, and
              // the prices captured at that moment. All four travel together, because a
              // tick without its price reads as a bargain nobody recorded.
              isChecked: options.progress ? item.isChecked : false,
              chainCode: options.progress ? item.chainCode : null,
              avgPrice: options.progress ? item.avgPrice : null,
              storePrice: options.progress ? item.storePrice : null,
            };

            return shoppingListService.addItemToShoppingList(copy.id, data);
          }),
        );

        failedItems = results.filter(
          (result) => result.status === "rejected",
        ).length;
      }

      // Both roots: the copy creates items, and the flat item list feeds watchlist
      // suggestions, which would otherwise not see them until something else refetched.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SHOPPING_LIST_QUERY_KEYS.all,
        }),
        queryClient.invalidateQueries({
          queryKey: SHOPPING_LIST_QUERY_KEYS.itemsAll,
        }),
      ]);

      closeModalUrl();
      if (failedItems > 0) {
        toast.warning(
          `Popis je kopiran, ali ${failedItems} proizvoda nije preneseno.`,
        );
      } else {
        toast.success("Popis za kupnju je uspješno kopiran!");
      }
      router.push(shoppingListPath(copy.id));
    } catch {
      toast.error("Greška pri kopiranju popisa za kupnju");
    } finally {
      setIsCopying(false);
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    options,
    setOption,
    canCopySharing,
    isCopying,
    copyList,
  };
}
