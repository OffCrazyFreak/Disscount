import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { ShoppingListDto } from "@/lib/api/schemas/shopping-list";
import type { ShoppingListItemDto } from "@/lib/api/schemas/shopping-list-item";

/** Per item, because restoring a whole-list snapshot undoes an overlapping write the server accepted. */
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

async function editItemsOptimistically(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemId: string,
  editItems: (items: ShoppingListItemDto[]) => ShoppingListItemDto[],
): Promise<IItemRollback | undefined> {
  await queryClient.cancelQueries({ queryKey });

  const previous = findItem(
    queryClient.getQueryData<ShoppingListDto>(queryKey),
    itemId,
  );
  if (!previous) return undefined;

  queryClient.setQueryData<ShoppingListDto | undefined>(queryKey, (old) =>
    old ? { ...old, items: editItems(old.items) } : old,
  );

  return previous;
}

export function patchItemOptimistically(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemId: string,
  patch: Partial<ShoppingListItemDto>,
): Promise<IItemRollback | undefined> {
  return editItemsOptimistically(queryClient, queryKey, itemId, (items) =>
    items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  );
}

export function removeItemOptimistically(
  queryClient: QueryClient,
  queryKey: QueryKey,
  itemId: string,
): Promise<IItemRollback | undefined> {
  return editItemsOptimistically(queryClient, queryKey, itemId, (items) =>
    items.filter((item) => item.id !== itemId),
  );
}

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
