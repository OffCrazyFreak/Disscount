"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { isSharedList } from "@/lib/api/shopping-lists/shared-list-polling";
import type { ShoppingListDto } from "@/lib/api/types";

interface IShoppingListUpdateStatusProps {
  shoppingList: ShoppingListDto;
}

/**
 * Tells a screen reader user that someone else changed the list under them, since a poll
 * rewrites it with no navigation or action of theirs to explain the new content.
 */
export default function ShoppingListUpdateStatus({
  shoppingList,
}: IShoppingListUpdateStatusProps) {
  const t = useTranslations("shoppingListDetail");
  const queryClient = useQueryClient();
  const regionRef = useRef<HTMLParagraphElement>(null);
  const lastVersionRef = useRef<{
    id: string;
    updatedAt: string;
    seenAt: number;
  }>(null);

  const { id, updatedAt } = shoppingList;
  const isShared = isSharedList(shoppingList);
  const message = t("updatedByOthers");

  useEffect(() => {
    const lastVersion = lastVersionRef.current;
    if (lastVersion?.id === id && lastVersion.updatedAt === updatedAt) return;

    lastVersionRef.current = { id, updatedAt, seenAt: Date.now() };
    if (lastVersion?.id !== id || !isShared) return;

    // Our own writes bump updatedAt too, and announcing those would echo every tick back.
    const wroteSinceLastVersion = queryClient
      .getMutationCache()
      .findAll({ mutationKey: SHOPPING_LIST_QUERY_KEYS.all })
      .some((mutation) => mutation.state.submittedAt >= lastVersion.seenAt);
    if (wroteSinceLastVersion) return;

    // Replacing the text node, rather than setting the same string again, is what makes a
    // second identical announcement count as a change to the live region.
    regionRef.current?.replaceChildren(message);
  }, [id, updatedAt, isShared, message, queryClient]);

  return (
    <p ref={regionRef} role="status" aria-live="polite" className="sr-only" />
  );
}
