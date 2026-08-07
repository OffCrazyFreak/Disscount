import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { CACHE_TIMES } from "@/lib/query/cache-times";
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
  getSharedShoppingList,
  updateSharedShoppingListItem,
  deleteSharedShoppingListItem,
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
 * There is deliberately no byToken descriptor here: see useGetSharedShoppingList.
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
    onSuccess: (result, { id, data }) => {
      // The response is the only place a freshly minted share token appears, so writing it
      // in is what makes the link available now rather than a refetch later.
      applyListResult(queryClient, id, result);

      // Turning sharing off kills the token server-side, but a copy of the list read
      // through it can sit in this browser's cache for the whole staleTime. Drop it so
      // revoking takes effect here immediately too.
      if (data.linkAccess === "NONE") {
        queryClient.removeQueries({
          queryKey: SHOPPING_LIST_QUERY_KEYS.sharedRoot,
        });
      }
    },
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

// Shared lists, reached by token rather than by id.

/**
 * A hook rather than a descriptor in shoppingListQueries, deliberately. A descriptor
 * there invites useAuthedQuery(shoppingListQueries.byToken(t)), which type-checks,
 * never warns, and never fetches: a link visitor has no session, so enabled is forced
 * false and `pending` reads false with no data. The shared page would show "not found"
 * to the only audience it has. There is nothing here to hand to useAuthedQuery.
 */
export function useGetSharedShoppingList(token: string) {
  return useQuery<ShoppingListDto, Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.byToken(token),
    queryFn: () => getSharedShoppingList(token),
    enabled: !!token,
    staleTime: CACHE_TIMES.sharedList,
    // Not the provider default, and the other half of the co-shopping story.
    refetchOnWindowFocus: true,
  });
}

function useInvalidateSharedList() {
  const queryClient = useQueryClient();
  return (token: string) =>
    queryClient.invalidateQueries({
      queryKey: SHOPPING_LIST_QUERY_KEYS.byToken(token),
    });
}

export function useUpdateSharedShoppingListItem() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSharedList();

  return useMutation<
    ShoppingListItemDto,
    Error,
    { token: string; itemId: string; data: ShoppingListItemRequest },
    IItemRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.sharedItemUpdate,
    mutationFn: ({ token, itemId, data }) =>
      updateSharedShoppingListItem(token, itemId, data),
    onMutate: ({ token, itemId, data }) =>
      patchItemOptimistically(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byToken(token),
        itemId,
        data,
      ),
    onError: (_error, { token }, rollback) =>
      restoreItem(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byToken(token),
        rollback,
      ),
    onSettled: (_data, _error, { token }) => invalidate(token),
  });
}

export function useDeleteSharedShoppingListItem() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSharedList();

  return useMutation<
    void,
    Error,
    { token: string; itemId: string },
    IItemRollback | undefined
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.sharedItemDelete,
    mutationFn: ({ token, itemId }) =>
      deleteSharedShoppingListItem(token, itemId),
    onMutate: ({ token, itemId }) =>
      removeItemOptimistically(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byToken(token),
        itemId,
      ),
    onError: (_error, { token }, rollback) =>
      restoreItem(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byToken(token),
        rollback,
      ),
    onSettled: (_data, _error, { token }) => invalidate(token),
  });
}
