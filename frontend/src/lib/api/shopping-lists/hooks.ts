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

export function useGetAllUserShoppingListItems({ enabled = true } = {}) {
  return useQuery<ShoppingListItemDto[], Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.myItems,
    queryFn: getAllUserShoppingListItems,
    enabled,
  });
}

// Shared lists, reached by token rather than by id.

export function useGetSharedShoppingList(token: string) {
  return useQuery<ShoppingListDto, Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.byToken(token),
    queryFn: () => getSharedShoppingList(token),
    enabled: !!token,
    // Two people shopping off one list need each other's ticks without a manual reload,
    // which is a shorter window than the rest of the app wants.
    staleTime: 30_000,
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
