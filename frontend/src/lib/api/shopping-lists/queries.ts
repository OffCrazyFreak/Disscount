import apiClient from "@/lib/api/api-base";
import {
  shoppingListDtoSchema,
  shoppingListItemDtoSchema,
  type ShoppingListCopyRequest,
  type ShoppingListRequest,
  type ShoppingListDto,
  type ShoppingListItemRequest,
  type ShoppingListItemDto,
} from "@/lib/api/types";

export async function createShoppingList(
  data: ShoppingListRequest,
): Promise<ShoppingListDto> {
  const response = await apiClient.post<unknown>("/api/shopping-lists", data);
  return shoppingListDtoSchema.parse(response.data);
}

export async function getCurrentUserShoppingLists(): Promise<
  ShoppingListDto[]
> {
  const response = await apiClient.get<unknown[]>("/api/shopping-lists/me");
  return response.data.map((item) => shoppingListDtoSchema.parse(item));
}

export async function getShoppingListById(
  id: string,
): Promise<ShoppingListDto> {
  const response = await apiClient.get<unknown>(`/api/shopping-lists/${id}`);
  return shoppingListDtoSchema.parse(response.data);
}

export async function updateShoppingList(
  id: string,
  data: ShoppingListRequest,
): Promise<ShoppingListDto> {
  const response = await apiClient.put<unknown>(
    `/api/shopping-lists/${id}`,
    data,
  );
  return shoppingListDtoSchema.parse(response.data);
}

export async function deleteShoppingList(id: string): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${id}`);
}

export async function addItemToShoppingList(
  listId: string,
  data: ShoppingListItemRequest,
): Promise<ShoppingListItemDto> {
  const response = await apiClient.post<unknown>(
    `/api/shopping-lists/${listId}/items`,
    data,
  );
  return shoppingListItemDtoSchema.parse(response.data);
}

export async function updateShoppingListItem(
  listId: string,
  itemId: string,
  data: ShoppingListItemRequest,
): Promise<ShoppingListItemDto> {
  const response = await apiClient.put<unknown>(
    `/api/shopping-lists/${listId}/items/${itemId}`,
    data,
  );
  return shoppingListItemDtoSchema.parse(response.data);
}

export async function deleteShoppingListItem(
  listId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`/api/shopping-lists/${listId}/items/${itemId}`);
}

/** One request, one transaction: the copy and its items commit together or not at all. */
export async function copyShoppingList(
  id: string,
  data: ShoppingListCopyRequest,
): Promise<ShoppingListDto> {
  const response = await apiClient.post<unknown>(
    `/api/shopping-lists/${id}/copy`,
    data,
  );
  return shoppingListDtoSchema.parse(response.data);
}

export async function getAllUserShoppingListItems(): Promise<
  ShoppingListItemDto[]
> {
  const response = await apiClient.get<unknown[]>("/api/shopping-lists/items");
  return response.data.map((item) => shoppingListItemDtoSchema.parse(item));
}
