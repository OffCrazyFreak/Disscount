"use client";

import { usePathname } from "@/i18n/navigation";
import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import { shoppingListIdFromPath } from "@/utils/routes";

export interface IListProgress {
  checked: number;
  total: number;
}

/** Undefined off a list's page or when empty, so the ring never reads as a broken bar at zero. */
export default function useActiveListProgress(): IListProgress | undefined {
  const pathname = usePathname();

  const { data: list } = useGetShoppingListById(
    shoppingListIdFromPath(pathname) ?? "",
  );

  if (!list?.items.length) return undefined;

  const checked = list.items.filter((item) => item.isChecked).length;

  return { checked, total: list.items.length };
}
