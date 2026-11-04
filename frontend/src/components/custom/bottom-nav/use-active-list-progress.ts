"use client";

import { usePathname } from "@/i18n/navigation";
import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import { shoppingListIdFromPath } from "@/utils/routes";

/** Undefined off a list's page and for an empty list, so the ring stays off rather than reading as a broken bar at zero. */
export default function useActiveListProgress(): number | undefined {
  const pathname = usePathname();

  const { data: list } = useGetShoppingListById(
    shoppingListIdFromPath(pathname) ?? "",
  );

  if (!list?.items.length) return undefined;

  const checked = list.items.filter((item) => item.isChecked).length;

  return checked / list.items.length;
}
