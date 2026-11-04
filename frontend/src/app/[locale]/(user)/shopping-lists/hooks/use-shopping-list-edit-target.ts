import { useQueryClient } from "@tanstack/react-query";

import type { ShoppingListDto } from "@/lib/api/types";
import { shoppingListService } from "@/lib/api";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

export function useShoppingListEditTarget(isEdit: boolean, id?: string) {
  const queryClient = useQueryClient();

  // Only seeds an instant value; by-id wins once loaded, since edits invalidate ["shoppingLists"] and refetch it.
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

  // Stricter than the API, which lets an EDIT recipient rename: no rename control goes to a non-owner, a product decision in docs/SHARING.md.
  const notOwner =
    !!shoppingList && !resolveShoppingListAccess(shoppingList.myAccess).isOwner;
  const notFound =
    notOwner || (isMissing && !byIdQuery.isLoading && !byIdQuery.isError);

  return { shoppingList, loading, loadError, notFound };
}
