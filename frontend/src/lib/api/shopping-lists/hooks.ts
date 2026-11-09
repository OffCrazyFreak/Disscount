import {
  queryOptions,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { sharedListRefetchInterval } from "@/lib/api/shopping-lists/shared-list-polling";
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
import { useTranslations } from "next-intl";

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

function currentUserShoppingListsQueryOptions() {
  return queryOptions({
    queryKey: SHOPPING_LIST_QUERY_KEYS.me,
    queryFn: getCurrentUserShoppingLists,
  });
}

// Shorter because several people can shop one list; a shared list polls so ticks show live.
function shoppingListByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: SHOPPING_LIST_QUERY_KEYS.byId(id),
    queryFn: () => getShoppingListById(id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

function allUserShoppingListItemsQueryOptions() {
  return queryOptions({
    queryKey: SHOPPING_LIST_QUERY_KEYS.myItems,
    queryFn: getAllUserShoppingListItems,
  });
}

export function useGetCurrentUserShoppingLists({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery({ ...currentUserShoppingListsQueryOptions(), enabled });
}

// Explicit so opting out need not mint a ["shoppingLists", ""] entry shaped like a real one.
export function useGetShoppingListById(id: string, { enabled = true } = {}) {
  // Subscribed, because refetchInterval recomputes on render or update, and a failed write triggers neither.
  const isWritingLists =
    useIsMutating({ mutationKey: SHOPPING_LIST_QUERY_KEYS.all }) > 0;

  return useQuery({
    ...shoppingListByIdQueryOptions(id),
    enabled: enabled && !!id && id !== "new",
    refetchInterval: (query) =>
      sharedListRefetchInterval(query, isWritingLists),
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
    // Written before the request leaves, because a component-state mirror clears early and flickers.
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
  const tUi = useTranslations("ui");
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
    // In onMutate for owned rollback; replays skip it, so the roots must stay in cached-query-keys.ts.
    onMutate: ({ listId, itemId, data }) =>
      patchItemOptimistically(
        queryClient,
        SHOPPING_LIST_QUERY_KEYS.byId(listId),
        itemId,
        data,
      ),
    // Reports too, because a hook-level onError replaces the default, or the tick reverts silently.
    onError: (error, { listId }, rollback) => {
      restoreItem(queryClient, SHOPPING_LIST_QUERY_KEYS.byId(listId), rollback);
      listWriteFailed(error, tUi);
    },
    // onSettled, not onSuccess: a rolled-back cache has to reconcile with the server too.
    onSettled: invalidate,
  });
}

export function useDeleteShoppingListItem() {
  const tUi = useTranslations("ui");
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
      deleteWriteFailed(error, tUi);
    },
    onSettled: invalidate,
  });
}

export function useGetAllUserShoppingListItems({ enabled = true } = {}) {
  return useQuery({ ...allUserShoppingListItemsQueryOptions(), enabled });
}
