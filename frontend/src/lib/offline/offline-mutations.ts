import type {
  MutationScope,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addItemToShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
} from "@/lib/api/shopping-lists";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import {
  deleteDigitalCard,
  saveDigitalCard,
  setDigitalCardArchived,
  setDigitalCardPinned,
} from "@/lib/api/digital-cards/queries";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import { addToWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
import type {
  DigitalCardRequest,
  ShoppingListRequest,
  ShoppingListItemRequest,
  WatchlistItemRequest,
} from "@/lib/api/types";
import {
  DIGITAL_CARD_MUTATION_SCOPE,
  OFFLINE_MUTATION_KEYS,
} from "@/lib/offline/offline-mutation-keys";
import { cardRetryDelay, shouldRetryCardWrite } from "@/lib/offline/card-retry";
import {
  cardDeleteFailed,
  cardWriteFailed,
} from "@/lib/offline/card-write-failed";
import {
  deleteWriteFailed,
  listWriteFailed,
  type OfflineToastTranslator,
} from "@/lib/offline/list-write-failed";

function listAndItemsKeys(listId: string): QueryKey[] {
  return [
    SHOPPING_LIST_QUERY_KEYS.byId(listId),
    SHOPPING_LIST_QUERY_KEYS.me,
    SHOPPING_LIST_QUERY_KEYS.myItems,
  ];
}

// A reload loses the inline mutationFn, so replays need these defaults registered first.
export function registerOfflineMutationDefaults(
  queryClient: QueryClient,
  t: OfflineToastTranslator,
) {
  function defineOfflineMutation<TVariables, TData>(
    mutationKey: QueryKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    invalidatedKeys: (variables: TVariables) => QueryKey[],
    // A reload also loses the onError passed at mutate() time, so a write that fails on
    // replay reverts with no explanation. Only pass this for mutations whose call sites
    // do NOT handle errors themselves, or the user gets the same toast twice.
    onError?: (error: Error) => void,
    // Persisted with the mutation; mutations sharing a scope replay one at a time.
    scope?: MutationScope,
  ) {
    queryClient.setMutationDefaults<TData, Error, TVariables>(mutationKey, {
      mutationFn,
      ...(scope ? { scope } : {}),
      // A restored paused card write that hits a passing failure must not end as an error,
      // because the persister keeps only paused mutations.
      ...(scope === DIGITAL_CARD_MUTATION_SCOPE
        ? { retry: shouldRetryCardWrite, retryDelay: cardRetryDelay }
        : {}),
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
    (error) => listWriteFailed(error, t),
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.shoppingListItemDelete,
    ({ listId, itemId }: { listId: string; itemId: string }) =>
      deleteShoppingListItem(listId, itemId),
    ({ listId }) => listAndItemsKeys(listId),
    // Deletes get their own handler: a replayed delete for an item that is already gone
    // answers 404, which is the desired end state rather than a failure, and the shared
    // handler would blame it on lost access.
    (error) => deleteWriteFailed(error, t),
  );

  // Tombstones for the two keys sharing used before it moved from a token to the list id.
  // A write queued by the previous build hydrates under one of these, and without a
  // mutationFn resuming it throws. Nothing can replay them: they carry a token, and the
  // endpoint behind it no longer exists. So they resolve, say what happened, and stop.
  for (const retiredKey of [
    ["sharedShoppingList", "items", "update"],
    ["sharedShoppingList", "items", "delete"],
  ]) {
    queryClient.setMutationDefaults(retiredKey, {
      mutationFn: async () => undefined,
      onSuccess: () => toast.error(t("offline.retiredWriteDropped")),
    });
  }

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.digitalCardSave,
    ({ id, data }: { id: string; data: DigitalCardRequest }) =>
      saveDigitalCard(id, data),
    () => [DIGITAL_CARD_QUERY_KEYS.me],
    cardWriteFailed,
    DIGITAL_CARD_MUTATION_SCOPE,
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.digitalCardDelete,
    (id: string) => deleteDigitalCard(id),
    () => [DIGITAL_CARD_QUERY_KEYS.me],
    cardDeleteFailed,
    DIGITAL_CARD_MUTATION_SCOPE,
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.digitalCardPin,
    ({ id, pinned }: { id: string; pinned: boolean }) =>
      setDigitalCardPinned(id, pinned),
    () => [DIGITAL_CARD_QUERY_KEYS.me],
    cardWriteFailed,
    DIGITAL_CARD_MUTATION_SCOPE,
  );

  defineOfflineMutation(
    OFFLINE_MUTATION_KEYS.digitalCardArchive,
    ({ id, archived }: { id: string; archived: boolean }) =>
      setDigitalCardArchived(id, archived),
    () => [DIGITAL_CARD_QUERY_KEYS.me],
    cardWriteFailed,
    DIGITAL_CARD_MUTATION_SCOPE,
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
