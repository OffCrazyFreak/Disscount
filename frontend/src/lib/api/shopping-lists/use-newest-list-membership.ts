"use client";

import { useGetCurrentUserShoppingLists } from "@/lib/api/shopping-lists/hooks";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";
import { useUser } from "@/context/user-context";

/**
 * Whether a product already sits on the list the add-to-list modal would preselect, so a
 * product row can offer "edit the entry" rather than "add" before the modal opens.
 *
 * Reads the cached me query rather than fetching the list by id: that payload already
 * carries each list's items, so this costs nothing beyond a subscription. Signed-out
 * visitors skip it, since the endpoint would only answer 401.
 */
export function useIsOnNewestShoppingList(ean: string | undefined): boolean {
  const { user } = useUser();
  const { data: shoppingLists = [] } = useGetCurrentUserShoppingLists({
    enabled: !!user,
  });

  if (!ean) return false;

  const newestList = sortShoppingListsByRecency(shoppingLists)[0];

  return !!newestList?.items?.some((item) => item.ean === ean);
}
