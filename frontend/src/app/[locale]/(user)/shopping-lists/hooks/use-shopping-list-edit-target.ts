import { useQueryClient } from "@tanstack/react-query";

import type { ShoppingListDto } from "@/lib/api/types";
import { shoppingListService } from "@/lib/api";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

/** The list the edit modal works on, plus why the form cannot show yet, if it cannot. */
export function useShoppingListEditTarget(isEdit: boolean, id?: string) {
  const queryClient = useQueryClient();

  // Only seeds an instant value while the reactive by-id query settles; by-id wins
  // once loaded, since edits invalidate ["shoppingLists"] and refetch it.
  const cachedList = queryClient
    .getQueryData<ShoppingListDto[]>(SHOPPING_LIST_QUERY_KEYS.me)
    ?.find((list) => list.id === id);
  const byIdQuery = shoppingListService.useGetShoppingListById(
    isEdit ? (id as string) : "",
  );
  const seededList = byIdQuery.isLoading ? cachedList : undefined;
  const shoppingList = isEdit ? (byIdQuery.data ?? seededList ?? null) : null;

  const isMissing = isEdit && !shoppingList;
  const loading = isMissing && byIdQuery.isLoading;
  const loadError = isMissing && byIdQuery.isError;

  // Renaming is an owner capability, and the by-id read now succeeds for link visitors
  // too, so a signed-in recipient reaching this modal by URL must land on the same dead
  // end as a stranger rather than on a form whose save would 403.
  // Through the resolver, not a literal, so the ownership rule lives in one place.
  // Deliberately stricter than the API, which allows an EDIT recipient to rename: no
  // rename control is offered to a non-owner anywhere, and docs/SHARING.md records that
  // as the product decision rather than an oversight.
  const notOwner =
    !!shoppingList && !resolveShoppingListAccess(shoppingList.myAccess).isOwner;
  const notFound =
    notOwner || (isMissing && !byIdQuery.isLoading && !byIdQuery.isError);

  return { shoppingList, loading, loadError, notFound };
}
