"use client";

import { useSyncExternalStore } from "react";

import { shoppingListQueries } from "@/lib/api/shopping-lists/hooks";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";
import { useAuthedQuery } from "@/lib/query/use-authed-query";
import {
  peekFormDraft,
  getFormDraftsVersion,
  subscribeToFormDrafts,
} from "@/utils/browser/local-storage";

/**
 * Whether a product already sits on the list the add-to-list modal would preselect,
 * so a product row can offer "edit the entry" rather than "add" before the modal
 * opens.
 *
 * Reads the cached me query rather than fetching the list by id: that payload
 * already carries each list's items, so this costs nothing beyond a subscription.
 * Signed-out visitors skip it, since the endpoint would only answer 401. That gate is
 * useAuthedQuery's, which resolves the session rather than waiting for the full profile.
 */
export function useIsOnPreselectedShoppingList(
  ean: string | undefined,
): boolean {
  const { data: shoppingLists = [] } = useAuthedQuery(shoppingListQueries.me());

  // Subscribed, not snapshotted: rows outlive the modal that writes the draft.
  useSyncExternalStore(subscribeToFormDrafts, getFormDraftsVersion, () => 0);

  if (!ean) return false;

  const drafted = peekFormDraft(`add-to-list.${ean}`)?.values.shoppingListId;
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
