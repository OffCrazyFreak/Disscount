import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../api-base";
import {
  ShoppingListRequest,
  ShoppingListDto,
  ShoppingListItemRequest,
  ShoppingListItemDto,
} from "../types";

/**
 * Create a new shopping list
 */
export async function createShoppingList(
  data: ShoppingListRequest
): Promise<ShoppingListDto> {
  const response = await apiClient.post<ShoppingListDto>(
    "/api/shopping-lists",
    data
  );
  return response.data;
}

/**
 * Get current user's shopping lists
 */
export async function getCurrentUserShoppingLists(): Promise<
  ShoppingListDto[]
> {
  const response = await apiClient.get<ShoppingListDto[]>(
    "/api/shopping-lists/me"
  );
  return response.data;
}

/**
 * Get shopping list by ID
 */
export async function getShoppingListById(
  id: string
): Promise<ShoppingListDto> {
  const response = await apiClient.get<ShoppingListDto>(
    `/api/shopping-lists/${id}`
  );
  return response.data;
}

/**
 * Update shopping list
 */
export async function updateShoppingList(
  id: string,
  data: ShoppingListRequest
): Promise<ShoppingListDto> {
  const response = await apiClient.put<ShoppingListDto>(
    `/api/shopping-lists/${id}`,
    data
  );
  return response.data;
}

/**
 * Delete shopping list
 */
export async function deleteShoppingList(id: string): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${id}`);
}

/**
 * Add item to shopping list
 */
export async function addItemToShoppingList(
  listId: string,
  data: ShoppingListItemRequest
): Promise<ShoppingListItemDto> {
  const response = await apiClient.post<ShoppingListItemDto>(
    `/api/shopping-lists/${listId}/items`,
    data
  );
  return response.data;
}

/**
 * Update shopping list item
 */
export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  data: ShoppingListItemRequest
): Promise<ShoppingListItemDto> {
  const response = await apiClient.put<ShoppingListItemDto>(
    `/api/shopping-lists/${listId}/items/${itemId}`,
    data
  );
  return response.data;
}

/**
 * Delete shopping list item
 */
export async function deleteShoppingListItem(
  listId: string,
  itemId: string
): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${listId}/items/${itemId}`);
}

/**
 * Get all items from user's active shopping lists
 */
export async function getAllUserShoppingListItems(): Promise<
  ShoppingListItemDto[]
> {
  const response = await apiClient.get<ShoppingListItemDto[]>(
    "/api/shopping-lists/items"
  );
  return response.data;
}

// React Query hooks
export const useCreateShoppingList = () => {
  return useMutation<ShoppingListDto, Error, ShoppingListRequest>({
    mutationFn: createShoppingList,
  });
};

export const useGetCurrentUserShoppingLists = () => {
  return useQuery<ShoppingListDto[], Error>({
    queryKey: ["shoppingLists", "me"],
    queryFn: getCurrentUserShoppingLists,
  });
};

export const useGetShoppingListById = (id: string) => {
  return useQuery<ShoppingListDto, Error>({
    queryKey: ["shoppingLists", id],
    queryFn: () => getShoppingListById(id),
    enabled: !!id && id !== "new", // Only fetch if id is valid and not "new"
  });
};

export const useUpdateShoppingList = () => {
  return useMutation<
    ShoppingListDto,
    Error,
    { id: string; data: ShoppingListRequest }
  >({
    mutationFn: ({ id, data }) => updateShoppingList(id, data),
  });
};

export const useDeleteShoppingList = () => {
  return useMutation<void, Error, string>({
    mutationFn: deleteShoppingList,
  });
};

export const useAddItemToShoppingList = () => {
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; data: ShoppingListItemRequest }
  >({
    mutationFn: ({ listId, data }) => addItemToShoppingList(listId, data),
  });
};

export const useUpdateShoppingListItem = () => {
  return useMutation<
    ShoppingListItemDto,
    Error,
    { listId: string; itemId: string; data: ShoppingListItemRequest }
  >({
    mutationFn: ({ listId, itemId, data }) =>
      updateShoppingListItem(listId, itemId, data),
  });
};

export const useDeleteShoppingListItem = () => {
  return useMutation<void, Error, { listId: string; itemId: string }>({
    mutationFn: ({ listId, itemId }) => deleteShoppingListItem(listId, itemId),
  });
};

export const useGetAllUserShoppingListItems = () => {
  return useQuery<ShoppingListItemDto[], Error>({
    queryKey: ["shoppingListItems", "me"],
    queryFn: getAllUserShoppingListItems,
  });
};

const shoppingListService = {
  createShoppingList,
  getCurrentUserShoppingLists,
  getShoppingListById,
  updateShoppingList,
  deleteShoppingList,
  addItemToShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
  getAllUserShoppingListItems,
  // React Query hooks
  useCreateShoppingList,
  useGetCurrentUserShoppingLists,
  useGetShoppingListById,
  useUpdateShoppingList,
  useDeleteShoppingList,
  useAddItemToShoppingList,
  useUpdateShoppingListItem,
  useDeleteShoppingListItem,
  useGetAllUserShoppingListItems,
};

export default shoppingListService;
