import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Types for shopping list
export interface ShoppingListItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  addedAt: string;
}

// Shopping list API functions
const shoppingListApi = {
  addItem: async (
    productId: string,
    quantity = 1
  ): Promise<ShoppingListItem> => {
    const response = await api.post("/api/shopping-list/items", {
      productId,
      quantity,
    });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<void> => {
    await api.delete(`/api/shopping-list/items/${itemId}`);
  },

  updateQuantity: async (
    itemId: string,
    quantity: number
  ): Promise<ShoppingListItem> => {
    const response = await api.patch(`/api/shopping-list/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },
};

// React Query hooks for shopping list mutations
export function useAddToShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      quantity = 1,
    }: {
      productId: string;
      quantity?: number;
    }) => shoppingListApi.addItem(productId, quantity),
    onSuccess: () => {
      // Invalidate shopping list queries to refetch
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: (error) => {
      console.error("Failed to add item to shopping list:", error);
      // You could show a toast notification here
    },
  });
}

export function useRemoveFromShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => shoppingListApi.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: (error) => {
      console.error("Failed to remove item from shopping list:", error);
    },
  });
}

export function useUpdateShoppingListQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      shoppingListApi.updateQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
    onError: (error) => {
      console.error("Failed to update quantity:", error);
    },
  });
}
