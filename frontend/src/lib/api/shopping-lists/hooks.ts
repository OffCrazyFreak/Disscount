import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import {
  patchItemOptimistically,
  removeItemOptimistically,
  restoreItem,
  type IItemRollback,
} from "@/lib/api/shopping-lists/optimistic-items";
import {
  applyListResult,
  patchListOptimistically,
  restoreList,
  type IListRollback,
} from "@/lib/api/shopping-lists/optimistic-list";
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

export function useCreateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<ShoppingListDto, Error, ShoppingListRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListCreate,
    mutationFn: createShoppingList,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: SHOPPING_LIST_QUERY_KEYS.all,
      }),
  });
}

export function useGetCurrentUserShoppingLists({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<ShoppingListDto[], Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.me,
    queryFn: getCurrentUserShoppingLists,
    enabled,
  });
}

// enabled is explicit so a caller that does not want this query can say so, rather than
// passing an empty id and minting a ["shoppingLists", ""] entry shaped like a real one.
export function useGetShoppingListById(id: string, { enabled = true } = {}) {
  return useQuery<ShoppingListDto, Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.byId(id),
    queryFn: () => getShoppingListById(id),
    enabled: enabled && !!id && id !== "new",
    // Shorter than the rest of the app wants, because this route serves link visitors as
    // well as the owner and two people can be shopping off one list. It is not live: with
    // both tabs focused and untouched nothing refetches, since staleTime only marks the
    // data stale and the refetch needs focus, a remount or an invalidation. Making it live
    // needs refetchInterval or a push channel, and neither is worth the battery until
    // somebody asks.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListRequest },
    IListRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    mutationFn: ({ id, data }) => updateShoppingList(id, data),
    // The cache is the single source of truth, written before the request leaves. Callers
    // used to mirror the new value in component state and clear it once the mutation
    // settled, which lands while the refetch invalidateQueries started is still in flight,
    // so the control fell back to the pre-save value and visibly flickered.
    onMutate: ({ id, data }) => patchListOptimistically(queryClient, id, data),
    onError: (_error, { id }, rollback) =>
      restoreList(queryClient, id, rollback),
    onSuccess: (result, { id }) => applyListResult(queryClient, id, result),
    // onSettled, not onSuccess: a rolled-back cache has to reconcile with the server too.
    onSettled: () =>
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
      queryClient.invalidateQueries({
        queryKey: SHOPPING_LIST_QUERY_KEYS.all,
      }),
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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateListsAndItems();

  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; itemId: string; data: ShoppingListItemRequest },
    IItemRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
    mutationFn: ({ listId, itemId, data }) =>
      updateShoppingListItem(listId, itemId, data),
    // In onMutate rather than at the call site so React Query owns the optimism and its
    // rollback. Note it does NOT re-run on replay: query-core skips onMutate for a
    // mutation restored as already pending. What survives a reload is the query snapshot
    // that onMutate wrote, which is why the shopping-list roots have to stay in
    // cached-query-keys.ts.
    onMutate: ({ listId, itemId, data }) =>
      patchItemOptimistically(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byId(listId),
        itemId,
        data,
      ),
    onError: (_error, { listId }, rollback) =>
      restoreItem(queryClient, SHOPPING_LIST_QUERY_KEYS.byId(listId), rollback),
    // onSettled, not onSuccess: a rolled-back cache has to reconcile with the server too.
    onSettled: invalidate,
  });
}

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateListsAndItems();

  return useMutation<
    void,
    Error,
    { listId: string; itemId: string },
    IItemRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemDelete,
    mutationFn: ({ listId, itemId }) => deleteShoppingListItem(listId, itemId),
    onMutate: ({ listId, itemId }) =>
      removeItemOptimistically(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byId(listId),
        itemId,
      ),
    onError: (_error, { listId }, rollback) =>
      restoreItem(queryClient, SHOPPING_LIST_QUERY_KEYS.byId(listId), rollback),
    onSettled: invalidate,
  });
}

export function useGetAllUserShoppingListItems({ enabled = true } = {}) {
  return useQuery<ShoppingListItemDto[], Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.myItems,
    queryFn: getAllUserShoppingListItems,
    enabled,
  });
}
