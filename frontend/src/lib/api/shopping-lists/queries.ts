import apiClient from "@/lib/api/api-base";
import {
  ShoppingListRequest,
  ShoppingListDto,
  ShoppingListItemRequest,
  ShoppingListItemDto,
} from "@/lib/api/types";

export async function createShoppingList(
  data: ShoppingListRequest,
): Promise<ShoppingListDto> {
  const response = await apiClient.post<ShoppingListDto>(
    "/api/shopping-lists",
    data,
  );
  return response.data;
}

export async function getCurrentUserShoppingLists(): Promise<
  ShoppingListDto[]
> {
  const response = await apiClient.get<ShoppingListDto[]>(
    "/api/shopping-lists/me",
  );
  return response.data;
}

export async function getShoppingListById(
  id: string,
): Promise<ShoppingListDto> {
  const response = await apiClient.get<ShoppingListDto>(
    `/api/shopping-lists/${id}`,
  );
  return response.data;
}

export async function updateShoppingList(
  id: string,
  data: ShoppingListRequest,
): Promise<ShoppingListDto> {
  const response = await apiClient.put<ShoppingListDto>(
    `/api/shopping-lists/${id}`,
    data,
  );
  return response.data;
}

export async function deleteShoppingList(id: string): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${id}`);
}

export async function addItemToShoppingList(
  listId: string,
  data: ShoppingListItemRequest,
): Promise<ShoppingListItemDto> {
  const response = await apiClient.post<ShoppingListItemDto>(
    `/api/shopping-lists/${listId}/items`,
    data,
  );
  return response.data;
}

export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  data: ShoppingListItemRequest,
): Promise<ShoppingListItemDto> {
  const response = await apiClient.put<ShoppingListItemDto>(
    `/api/shopping-lists/${listId}/items/${itemId}`,
    data,
  );
  return response.data;
}

export async function deleteShoppingListItem(
  listId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${listId}/items/${itemId}`);
}

export async function getAllUserShoppingListItems(): Promise<
  ShoppingListItemDto[]
> {
  const response = await apiClient.get<ShoppingListItemDto[]>(
    "/api/shopping-lists/items",
  );
  return response.data;
}
