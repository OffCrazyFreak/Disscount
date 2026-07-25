"use client";

import { usePathname } from "next/navigation";
import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import { shoppingListIdFromPath } from "@/utils/route-ids";

/**
 * The ticked share of the list whose page you are on, so a glance at the bar in
 * a store says how far through you are. Null anywhere else, and for empty lists.
 */
export default function useShoppingListProgress(): number | null {
  const listId = shoppingListIdFromPath(usePathname());
  const { data: list } = useGetShoppingListById(listId ?? "");

  const items = list?.items ?? [];
  if (!items.length) return null;

  return items.filter((item) => item.isChecked).length / items.length;
}
