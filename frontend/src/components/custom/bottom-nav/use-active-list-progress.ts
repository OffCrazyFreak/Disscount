"use client";

import { usePathname } from "next/navigation";
import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import { shoppingListIdFromPath } from "@/utils/routes";

/**
 * How much of the list you are currently looking at is ticked off, so the ring
 * around Popisi tracks that one list while you shop it.
 *
 * Undefined anywhere but a list's own page, and undefined for an empty list, so
 * the ring stays off rather than sitting at zero and reading as a broken bar.
 */
export default function useActiveListProgress(): number | undefined {
  const pathname = usePathname();

  const { data: list } = useGetShoppingListById(
    shoppingListIdFromPath(pathname) ?? "",
  );

  if (!list?.items.length) return undefined;

  const checked = list.items.filter((item) => item.isChecked).length;

  return checked / list.items.length;
}
