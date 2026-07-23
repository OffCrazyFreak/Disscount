import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const LISTS_KEY = ["shoppingLists"];
const LIST_ITEMS_KEY = ["shoppingListItems"];

export function useCreateShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<ShoppingListDto, Error, ShoppingListRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListCreate,
    mutationFn: createShoppingList,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
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
  const queryClient = useQueryClient();
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListRequest }
  >({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    mutationFn: ({ id, data }) => updateShoppingList(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useDeleteShoppingList() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.shoppingListDelete,
    mutationFn: deleteShoppingList,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

function useInvalidateListsAndItems() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: LISTS_KEY }),
      queryClient.invalidateQueries({ queryKey: LIST_ITEMS_KEY }),
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
    queryKey: ["shoppingListItems", "me"],
    queryFn: getAllUserShoppingListItems,
    enabled,
  });
}
