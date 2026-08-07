import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { ShoppingListDto } from "@/lib/api/schemas/shopping-list";
import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";

/**
 * Optimistic item edits, scoped to the one item being written.
 *
 * Rolling back a whole-list snapshot looks equivalent and is not: two quick writes
 * overlap, so restoring the list as it was before write A also undoes write B, which the
 * server has already accepted. The item then reads as unbought while the server has it
 * bought, and nothing refetches to correct it.
 */
export interface IItemRollback {
  item: ShoppingListItemDto;
  index: number;
}

function findItem(
  list: ShoppingListDto | undefined,
  itemId: string,
): IItemRollback | undefined {
  const index = list?.items?.findIndex((item) => item.id === itemId) ?? -1;
  if (!list || index < 0) return undefined;

  return { item: list.items[index], index };
}

export async function patchItemOptimistically(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemId: string,
  patch: Partial<ShoppingListItemDto>,
): Promise<IItemRollback | undefined> {
  await queryClient.cancelQueries({ queryKey });

  const previous = findItem(
    queryClient.getQueryData<ShoppingListDto>(queryKey),
    itemId,
  );
  if (!previous) return undefined;

  queryClient.setQueryData<ShoppingListDto | undefined>(queryKey, (old) =>
    old
      ? {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        }
      : old,
  );

  return previous;
}

export async function removeItemOptimistically(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemId: string,
): Promise<IItemRollback | undefined> {
  await queryClient.cancelQueries({ queryKey });

  const previous = findItem(
    queryClient.getQueryData<ShoppingListDto>(queryKey),
    itemId,
  );
  if (!previous) return undefined;

  queryClient.setQueryData<ShoppingListDto | undefined>(queryKey, (old) =>
    old
      ? { ...old, items: old.items.filter((item) => item.id !== itemId) }
      : old,
  );

  return previous;
}

/** Puts one item back where it was, leaving every other item as it now stands. */
export function restoreItem(
  queryClient: QueryClient,
  queryKey: QueryKey,
  rollback: IItemRollback | undefined,
) {
  if (!rollback) return;

  queryClient.setQueryData<ShoppingListDto | undefined>(queryKey, (old) => {
    if (!old) return old;

    const without = old.items.filter((item) => item.id !== rollback.item.id);
    without.splice(rollback.index, 0, rollback.item);

    return { ...old, items: without };
  });
}
