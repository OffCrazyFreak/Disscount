import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
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
  updateSharedShoppingList,
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

export function useGetShoppingListById(id: string) {
  return useQuery<ShoppingListDto, Error>({
    queryKey: SHOPPING_LIST_QUERY_KEYS.byId(id),
    queryFn: () => getShoppingListById(id),
    enabled: !!id && id !== "new", // Only fetch if id is valid and not "new"
  });
}

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
      queryClient.invalidateQueries({
        queryKey: SHOPPING_LIST_QUERY_KEYS.all,
      }),
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

export function useUpdateSharedShoppingList() {
  const invalidate = useInvalidateSharedList();
  return useMutation<
    ShoppingListDto,
    Error,
    { token: string; data: ShoppingListRequest }
  >({
    mutationFn: ({ token, data }) => updateSharedShoppingList(token, data),
    onSuccess: (_data, { token }) => invalidate(token),
  });
}

export function useUpdateSharedShoppingListItem() {
  const invalidate = useInvalidateSharedList();
  return useMutation<
    ShoppingListItemDto,
    Error,
    { token: string; itemId: string; data: ShoppingListItemRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.sharedItemUpdate,
    mutationFn: ({ token, itemId, data }) =>
      updateSharedShoppingListItem(token, itemId, data),
    onSuccess: (_data, { token }) => invalidate(token),
  });
}

export function useDeleteSharedShoppingListItem() {
  const invalidate = useInvalidateSharedList();
  return useMutation<void, Error, { token: string; itemId: string }>({
    mutationKey: OFFLINE_MUTATION_KEYS.sharedItemDelete,
    mutationFn: ({ token, itemId }) =>
      deleteSharedShoppingListItem(token, itemId),
    onSuccess: (_data, { token }) => invalidate(token),
  });
}
