import type { QueryClient, QueryKey } from "@tanstack/react-query";

import {
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addItemToShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
} from "@/lib/api/shopping-lists";
import { addToWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
import type {
  ShoppingListRequest,
  ShoppingListItemRequest,
  WatchlistItemRequest,
} from "@/lib/api/types";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";

const SHOPPING_LISTS_ME: QueryKey = ["shoppingLists", "me"];

function listAndItemsKeys(listId: string): QueryKey[] {
  return [
    ["shoppingLists", listId],
    SHOPPING_LISTS_ME,
    ["shoppingListItems", "me"],
  ];
}

// A reload loses the inline mutationFn, so replays need these defaults registered first.
export function registerOfflineMutationDefaults(queryClient: QueryClient) {
  function defineOfflineMutation<TVariables, TData>(
    mutationKey: QueryKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    invalidatedKeys: (variables: TVariables) => QueryKey[],
  ) {
    queryClient.setMutationDefaults<TData, Error, TVariables>(mutationKey, {
      mutationFn,
      onSettled: (_data, _error, variables) => {
        for (const queryKey of invalidatedKeys(variables)) {
          queryClient.invalidateQueries({ queryKey });
        }
      },
    });
  }

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListCreate,
    (data: ShoppingListRequest) => createShoppingList(data),
    () => [SHOPPING_LISTS_ME],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    ({ id, data }: { id: string; data: ShoppingListRequest }) =>
      updateShoppingList(id, data),
    ({ id }) => [["shoppingLists", id], SHOPPING_LISTS_ME],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListDelete,
    (id: string) => deleteShoppingList(id),
    (id) => [["shoppingLists", id], SHOPPING_LISTS_ME],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListItemAdd,
    ({ listId, data }: { listId: string; data: ShoppingListItemRequest }) =>
      addItemToShoppingList(listId, data),
    ({ listId }) => listAndItemsKeys(listId),
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListItemUpdate,
    ({
      listId,
      itemId,
      data,
    }: {
      listId: string;
      itemId: string;
      data: ShoppingListItemRequest;
    }) => updateShoppingListItem(listId, itemId, data),
    ({ listId }) => listAndItemsKeys(listId),
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListItemDelete,
    ({ listId, itemId }: { listId: string; itemId: string }) =>
      deleteShoppingListItem(listId, itemId),
    ({ listId }) => listAndItemsKeys(listId),
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.watchlistAdd,
    (data: WatchlistItemRequest) => addToWatchlist(data),
    () => [["watchlist"]],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.watchlistRemove,
    (id: string) => removeFromWatchlist(id),
    () => [["watchlist"]],
  );
}
