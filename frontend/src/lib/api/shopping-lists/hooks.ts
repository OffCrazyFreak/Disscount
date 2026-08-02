import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import {
  ShoppingListRequest,
  ShoppingListDto,
  ShoppingListItemRequest,
  ShoppingListItemDto,
} from "@/lib/api/types";
import {
  createShoppingList,
  getCurrentUserShoppingLists,
  getShoppingListById,
  updateShoppingList,
  deleteShoppingList,
  addItemToShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
  getAllUserShoppingListItems,
} from "@/lib/api/shopping-lists/queries";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

export function useCreateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<ShoppingListDto, Error, ShoppingListRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListCreate,
    mutationFn: createShoppingList,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.all }),
  });
}

/**
 * Read descriptors rather than hooks, so the React layer decides how to consume
 * them: useAuthedQuery on a page, useQueries in a batch, prefetch or
 * getQueryData elsewhere. It also keeps this module free of the auth context,
 * which imports the lib/api barrel and would otherwise close an import cycle.
 */
export const shoppingListQueries = {
  me: () =>
    queryOptions({
      queryKey: SHOPPING_LIST_QUERY_KEYS.me,
      queryFn: getCurrentUserShoppingLists,
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: SHOPPING_LIST_QUERY_KEYS.byId(id),
      queryFn: () => getShoppingListById(id),
      // "new" is the create route's placeholder, not a real list.
      enabled: !!id && id !== "new",
    }),

  myItems: () =>
    queryOptions({
      queryKey: SHOPPING_LIST_QUERY_KEYS.myItems,
      queryFn: getAllUserShoppingListItems,
    }),
};

export function useUpdateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    mutationFn: ({ id, data }) => updateShoppingList(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.all }),
  });
}

export function useDeleteShoppingList() {
  const invalidate = useInvalidateListsAndItems();
  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListDelete,
    mutationFn: deleteShoppingList,
    onSuccess: invalidate,
  });
}

function useInvalidateListsAndItems() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.all }),
      queryClient.invalidateQueries({
        queryKey: SHOPPING_LIST_QUERY_KEYS.itemsAll,
      }),
    ]);
}

export function useAddItemToShoppingList() {
  const invalidate = useInvalidateListsAndItems();
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; data: ShoppingListItemRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemAdd,
    mutationFn: ({ listId, data }) => addItemToShoppingList(listId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateShoppingListItem() {
  const invalidate = useInvalidateListsAndItems();
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; itemId: string; data: ShoppingListItemRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
    mutationFn: ({ listId, itemId, data }) =>
      updateShoppingListItem(listId, itemId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteShoppingListItem() {
  const invalidate = useInvalidateListsAndItems();
  return useMutation<void, Error, { listId: string; itemId: string }>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemDelete,
    mutationFn: ({ listId, itemId }) => deleteShoppingListItem(listId, itemId),
    onSuccess: invalidate,
  });
}
