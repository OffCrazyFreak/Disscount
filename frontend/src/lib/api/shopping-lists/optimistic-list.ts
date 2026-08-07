import type { QueryClient } from "@tanstack/react-query";

import type {
  ShoppingListDto,
  ShoppingListRequest,
} from "@/lib/api/schemas/shopping-list";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

/**
 * Optimistic edits to a list's own fields, as opposed to its items.
 *
 * Without this, a save reads as new, then old, then new: `invalidateQueries` only starts a
 * refetch, so anything rendering the list keeps showing the pre-save value for a whole
 * round trip. Mirroring the value in component state does not fix it either, because that
 * mirror has to be cleared at some point and the cache is still stale when it is.
 */
export interface IListRollback {
  byId?: ShoppingListDto;
  all?: ShoppingListDto[];
}

function patch(
  list: ShoppingListDto,
  data: ShoppingListRequest,
): ShoppingListDto {
  return {
    ...list,
    title: data.title,
    // Only when the request carried it, so a rename does not silently unshare a list.
    ...(data.linkAccess === undefined ? {} : { linkAccess: data.linkAccess }),
  };
}

export async function patchListOptimistically(
  queryClient: QueryClient,
  id: string,
  data: ShoppingListRequest,
): Promise<IListRollback> {
  const byIdKey = SHOPPING_LIST_QUERY_KEYS.byId(id);

  // Stops an in-flight GET from resolving after this write and restoring the old value.
  await queryClient.cancelQueries({ queryKey: byIdKey });
  await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_QUERY_KEYS.me });

  const rollback: IListRollback = {
    byId: queryClient.getQueryData<ShoppingListDto>(byIdKey),
    all: queryClient.getQueryData<ShoppingListDto[]>(
      SHOPPING_LIST_QUERY_KEYS.me,
    ),
  };

  queryClient.setQueryData<ShoppingListDto | undefined>(byIdKey, (old) =>
    old ? patch(old, data) : old,
  );

  // The cards carry the same title and sharing indicator, so leaving them out would just
  // move the stale read somewhere else.
  queryClient.setQueryData<ShoppingListDto[] | undefined>(
    SHOPPING_LIST_QUERY_KEYS.me,
    (old) =>
      old?.map((list) => (list.id === id ? patch(list, data) : list)) ?? old,
  );

  return rollback;
}

/** Writes the server's answer in, which is what carries a freshly minted share token. */
export function applyListResult(
  queryClient: QueryClient,
  id: string,
  result: ShoppingListDto,
) {
  queryClient.setQueryData<ShoppingListDto | undefined>(
    SHOPPING_LIST_QUERY_KEYS.byId(id),
    (old) => (old ? { ...old, ...result } : result),
  );

  queryClient.setQueryData<ShoppingListDto[] | undefined>(
    SHOPPING_LIST_QUERY_KEYS.me,
    (old) =>
      old?.map((list) => (list.id === id ? { ...list, ...result } : list)) ??
      old,
  );
}

export function restoreList(
  queryClient: QueryClient,
  id: string,
  rollback: IListRollback | undefined,
) {
  if (!rollback) return;

  if (rollback.byId) {
    queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.byId(id), rollback.byId);
  }
  if (rollback.all) {
    queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.me, rollback.all);
  }
}
