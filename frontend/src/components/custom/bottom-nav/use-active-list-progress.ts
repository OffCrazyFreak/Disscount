"use client";

import { useUser } from "@/context/user-context";
import { useGetCurrentUserShoppingLists } from "@/lib/api/shopping-lists/hooks";

/**
 * How much of the list you touched most recently is ticked off, which is the
 * closest thing to an "active" list without inventing a new concept for it.
 *
 * Undefined whenever there is nothing worth showing, so the ring stays off
 * rather than sitting at zero and reading as a broken progress bar.
 */
export default function useActiveListProgress(): number | undefined {
  const { isAuthenticated } = useUser();
  const { data } = useGetCurrentUserShoppingLists({ enabled: isAuthenticated });

  const active = data
    ?.filter((list) => list.items.length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .at(0);

  if (!active) return undefined;

  const checked = active.items.filter((item) => item.isChecked).length;

  return checked / active.items.length;
}
