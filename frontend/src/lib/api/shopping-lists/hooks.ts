import { useMutation, useQuery } from "@tanstack/react-query";
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

export function useCreateShoppingList() {
  return useMutation<ShoppingListDto, Error, ShoppingListRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListCreate,
    mutationFn: createShoppingList,
  });
}

export function useGetCurrentUserShoppingLists({
  enabled = true,
}: { enabled?: boolean } = {}) {
  return useQuery<ShoppingListDto[], Error>({
    queryKey: ["shoppingLists", "me"],
    queryFn: getCurrentUserShoppingLists,
    enabled,
  });
}

export function useGetShoppingListById(id: string) {
  return useQuery<ShoppingListDto, Error>({
    queryKey: ["shoppingLists", id],
    queryFn: () => getShoppingListById(id),
    enabled: !!id && id !== "new", // Only fetch if id is valid and not "new"
  });
}

export function useUpdateShoppingList() {
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    mutationFn: ({ id, data }) => updateShoppingList(id, data),
  });
}

export function useDeleteShoppingList() {
  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListDelete,
    mutationFn: deleteShoppingList,
  });
}

export function useAddItemToShoppingList() {
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; data: ShoppingListItemRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemAdd,
    mutationFn: ({ listId, data }) => addItemToShoppingList(listId, data),
  });
}

export function useUpdateShoppingListItem() {
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; itemId: string; data: ShoppingListItemRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
    mutationFn: ({ listId, itemId, data }) =>
      updateShoppingListItem(listId, itemId, data),
  });
}

export function useDeleteShoppingListItem() {
  return useMutation<void, Error, { listId: string; itemId: string }>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemDelete,
    mutationFn: ({ listId, itemId }) => deleteShoppingListItem(listId, itemId),
  });
}

export function useGetAllUserShoppingListItems({ enabled = true } = {}) {
  return useQuery<ShoppingListItemDto[], Error>({
    queryKey: ["shoppingListItems", "me"],
    queryFn: getAllUserShoppingListItems,
    enabled,
  });
}
