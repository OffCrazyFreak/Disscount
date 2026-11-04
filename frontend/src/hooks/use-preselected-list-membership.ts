"use client";

import { useSyncExternalStore } from "react";

import { useGetCurrentUserShoppingLists } from "@/lib/api/shopping-lists/hooks";
import { sortShoppingListsByRecency } from "@/lib/api/shopping-lists/sort-lists";
import {
  peekFormDraft,
  getFormDraftsVersion,
  subscribeToFormDrafts,
} from "@/utils/browser/local-storage";
import { useUser } from "@/context/user-context";

/** Reads the cached me query, whose payload already has each list's items; signed-out visitors skip it, since it would only answer 401. */
export function useIsOnPreselectedShoppingList(
  ean: string | undefined,
): boolean {
  const { user } = useUser();
  const { data: shoppingLists = [] } = useGetCurrentUserShoppingLists({
    enabled: !!user,
  });

  // Subscribed, not snapshotted: rows outlive the modal that writes the draft.
  useSyncExternalStore(subscribeToFormDrafts, getFormDraftsVersion, () => 0);

  if (!ean) return false;

  const drafted = peekFormDraft(`add-to-list.${ean}`)?.values.shoppingListId;
  const draftedListId = typeof drafted === "string" ? drafted : null;

  // The same rule as useSelectedShoppingList, or the icon would describe a list the modal is not going to open on.
  if (draftedListId === "new") return false;

  const sorted = sortShoppingListsByRecency(shoppingLists);
  const preselected =
    sorted.find((list) => list.id === draftedListId) ?? sorted[0];

  return !!preselected?.items?.some((item) => item.ean === ean);
}
