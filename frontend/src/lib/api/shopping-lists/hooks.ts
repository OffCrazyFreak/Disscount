import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { CACHE_TIMES } from "@/lib/query/cache-times";
import {
  deleteWriteFailed,
  listWriteFailed,
} from "@/lib/offline/list-write-failed";
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
  ShoppingListCopyRequest,
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
  copyShoppingList,
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

/**
 * Read descriptors rather than hooks, so the React layer decides how to consume
 * them: useAuthedQuery on a page, useQueries in a batch, prefetch or
 * getQueryData elsewhere. It also keeps this module free of the auth context,
 * which imports the lib/api barrel and would otherwise close an import cycle.
 *
 * byId is deliberately NOT auth-gated by its consumers on the detail route: a list id is
 * the shareable URL now, so that page is reachable signed out and useAuthedQuery there
 * would leave a link visitor with a query that never fires. Owner-only surfaces (the
 * share, copy and edit modals) still read it through useAuthedQuery.
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
      // "new" is the create route's placeholder, not a real list. A caller that wants a
      // further gate spreads the descriptor and overrides enabled.
      enabled: !!id && id !== "new",
      // Shorter than the rest of the app wants, because this route serves link visitors as
      // well as the owner and two people can be shopping off one list. It is not live: with
      // both tabs focused and untouched nothing refetches, since staleTime only marks the
      // data stale and the refetch needs focus, a remount or an invalidation. Making it live
      // needs refetchInterval or a push channel, and neither is worth the battery until
      // somebody asks.
      staleTime: CACHE_TIMES.sharedList,
      refetchOnWindowFocus: true,
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

export function useCopyShoppingList() {
  const invalidate = useInvalidateListsAndItems();
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListCopyRequest }
  >({
    mutationFn: ({ id, data }) => copyShoppingList(id, data),
    onSettled: invalidate,
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
    // Reports as well as rolls back. A hook-level onError replaces the mutation
    // default's rather than running alongside it, so without calling the shared handler
    // here a live failure reverted the tick in silence and only a replay after a reload
    // ever explained itself.
    onError: (error, { listId }, rollback) => {
      restoreItem(queryClient, SHOPPING_LIST_QUERY_KEYS.byId(listId), rollback);
      listWriteFailed(error);
    },
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
    onError: (error, { listId }, rollback) => {
      restoreItem(queryClient, SHOPPING_LIST_QUERY_KEYS.byId(listId), rollback);
      deleteWriteFailed(error);
    },
    onSettled: invalidate,
  });
}
