import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addItemToShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
  updateSharedShoppingListItem,
  deleteSharedShoppingListItem,
} from "@/lib/api/shopping-lists";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { parseProblem } from "@/lib/api/problem-details";
import { addToWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
import type {
  ShoppingListRequest,
  ShoppingListItemRequest,
  WatchlistItemRequest,
} from "@/lib/api/types";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";

function listAndItemsKeys(listId: string): QueryKey[] {
  return [
    SHOPPING_LIST_QUERY_KEYS.byId(listId),
    SHOPPING_LIST_QUERY_KEYS.me,
    SHOPPING_LIST_QUERY_KEYS.myItems,
  ];
}

// A reload loses the inline mutationFn, so replays need these defaults registered first.
export function registerOfflineMutationDefaults(queryClient: QueryClient) {
  function defineOfflineMutation<TVariables, TData>(
    mutationKey: QueryKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    invalidatedKeys: (variables: TVariables) => QueryKey[],
    // A reload also loses the onError passed at mutate() time, so a write that fails on
    // replay reverts with no explanation. Only pass this for mutations whose call sites
    // do NOT handle errors themselves, or the user gets the same toast twice.
    onError?: (error: Error) => void,
  ) {
    queryClient.setMutationDefaults<TData, Error, TVariables>(mutationKey, {
      mutationFn,
      ...(onError ? { onError } : {}),
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
    () => [SHOPPING_LIST_QUERY_KEYS.me],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListUpdate,
    ({ id, data }: { id: string; data: ShoppingListRequest }) =>
      updateShoppingList(id, data),
    ({ id }) => [
      SHOPPING_LIST_QUERY_KEYS.byId(id),
      SHOPPING_LIST_QUERY_KEYS.me,
    ],
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListDelete,
    (id: string) => deleteShoppingList(id),
    (id) => [SHOPPING_LIST_QUERY_KEYS.byId(id), SHOPPING_LIST_QUERY_KEYS.me],
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

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.sharedItemUpdate,
    ({
      token,
      itemId,
      data,
    }: {
      token: string;
      itemId: string;
      data: ShoppingListItemRequest;
    }) => updateSharedShoppingListItem(token, itemId, data),
    ({ token }) => [SHOPPING_LIST_QUERY_KEYS.byToken(token)],
    sharedWriteFailed,
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.sharedItemDelete,
    ({ token, itemId }: { token: string; itemId: string }) =>
      deleteSharedShoppingListItem(token, itemId),
    ({ token }) => [SHOPPING_LIST_QUERY_KEYS.byToken(token)],
    sharedWriteFailed,
  );
}

/**
 * Access to a shared list can be withdrawn between queuing a write and replaying it, and
 * the owner is under no obligation to warn anyone. Saying so beats a silent revert.
 *
 * Only for 403 and 404 though. This default also runs for live online failures, so
 * blaming access loss for every error told a collaborator with perfectly good access
 * that they had lost it because a request happened to time out. A 404 additionally
 * covers a replayed delete for an item that is already gone, which is harmless.
 */
function sharedWriteFailed(error: Error) {
  const status = parseProblem(error)?.status;
  const lostAccess = status === 403 || status === 404;

  toast.error(
    lostAccess
      ? "Promjena nije spremljena. Možda više nemaš pristup ovom popisu."
      : "Promjena nije spremljena. Pokušaj ponovno.",
  );
}
