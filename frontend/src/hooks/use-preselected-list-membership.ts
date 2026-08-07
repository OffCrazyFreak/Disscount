"use client";

import { useSyncExternalStore } from "react";

import { useGetCurrentUserShoppingLists } from "@/lib/api/shopping-lists/hooks";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";
import {
  getFormDraft,
  getFormDraftsVersion,
  subscribeToFormDrafts,
} from "@/utils/browser/local-storage";
import { useUser } from "@/context/user-context";

/**
 * Whether a product already sits on the list the add-to-list modal would preselect,
 * so a product row can offer "edit the entry" rather than "add" before the modal
 * opens.
 *
 * Reads the cached me query rather than fetching the list by id: that payload
 * already carries each list's items, so this costs nothing beyond a subscription.
 * Signed-out visitors skip it, since the endpoint would only answer 401.
 */
export function useIsOnPreselectedShoppingList(
  ean: string | undefined,
): boolean {
  const { user } = useUser();
  const { data: shoppingLists = [] } = useGetCurrentUserShoppingLists({
    enabled: !!user,
  });

  // Subscribed, not snapshotted at mount. Product rows stay mounted while the add-to-list
  // modal opens over them, so a drafted choice made in that modal has to reach the row
  // behind it: without this the icon claims one list while the modal reopens on another,
  // which is the exact contradiction this hook exists to prevent. The version counter is
  // what changes, so the localStorage read still happens once per change rather than once
  // per render.
  useSyncExternalStore(subscribeToFormDrafts, getFormDraftsVersion, () => 0);

  if (!ean) return false;

  const drafted = getFormDraft(`add-to-list.${ean}`)?.values.shoppingListId;
  const draftedListId = typeof drafted === "string" ? drafted : null;

  // The same rule useSelectedShoppingList applies, or the icon would describe a
  // list the modal is not going to open on: a drafted choice wins while that list
  // still exists, the newest list is the fallback, and a drafted "new" list has no
  // items to be on.
  if (draftedListId === "new") return false;

  const sorted = sortShoppingListsByRecency(shoppingLists);
  const preselected =
    sorted.find((list) => list.id === draftedListId) ?? sorted[0];

  return !!preselected?.items?.some((item) => item.ean === ean);
}
