"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { isSharedList } from "@/lib/api/shopping-lists/shared-list-polling";
import type { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListUpdateStatusProps {
  shoppingList: ShoppingListDto;
  fetchedAt: number;
}

/**
 * Tells a screen reader user that someone else changed the list under them, since a poll
 * rewrites it with no navigation or action of theirs to explain the new content.
 */
export default function ShoppingListUpdateStatus({
  shoppingList,
  fetchedAt,
}: IShoppingListUpdateStatusProps) {
  const t = useTranslations("shoppingListDetail");
  const queryClient = useQueryClient();
  const regionRef = useRef<HTMLParagraphElement>(null);
  const lastVersionRef = useRef<{
    id: string;
    updatedAt: string;
    fetchedAt: number;
    hadPendingWrites: boolean;
  }>(null);

  const { id, updatedAt } = shoppingList;
  const isShared = isSharedList(shoppingList);
  const message = t("updatedByOthers");

  useEffect(() => {
    const lastVersion = lastVersionRef.current;
    const writes = { mutationKey: SHOPPING_LIST_QUERY_KEYS.all };

    // Every fetch is recorded, even one bringing the same version, so a write that has
    // settled since stops counting as in flight. The fetch time rather than the mount time,
    // so a cached list opened later does not take a write you made elsewhere for someone else's.
    lastVersionRef.current = {
      id,
      updatedAt,
      fetchedAt,
      hadPendingWrites: queryClient.isMutating(writes) > 0,
    };
    const isNewVersion =
      lastVersion?.id === id && lastVersion.updatedAt !== updatedAt;
    if (!isNewVersion || !isShared) return;

    // Our own writes bump updatedAt too, and announcing those would echo every tick back.
    // One still in flight when the last version landed may be what this version carries.
    const wroteSinceLastVersion = queryClient
      .getMutationCache()
      .findAll(writes)
      .some((mutation) => mutation.state.submittedAt >= lastVersion.fetchedAt);
    if (lastVersion.hadPendingWrites || wroteSinceLastVersion) return;

    // Replacing the text node, rather than setting the same string again, is what makes a
    // second identical announcement count as a change to the live region.
    regionRef.current?.replaceChildren(message);
  }, [id, updatedAt, fetchedAt, isShared, message, queryClient]);

  return (
    <p ref={regionRef} role="status" aria-live="polite" className="sr-only" />
  );
}
