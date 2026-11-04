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

/** A poll rewrites the list with no action of theirs to explain the new content, so tell screen reader users someone else changed it. */
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

    // Recorded even for the same version, so a settled write stops counting; fetch time, so a cached list does not misattribute a write made elsewhere.
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
    const wroteSinceLastVersion = queryClient
      .getMutationCache()
      .findAll(writes)
      .some((mutation) => mutation.state.submittedAt >= lastVersion.fetchedAt);
    if (lastVersion.hadPendingWrites || wroteSinceLastVersion) return;

    // Replacing the text node makes a second identical announcement count as a change to the live region.
    regionRef.current?.replaceChildren(message);
  }, [id, updatedAt, fetchedAt, isShared, message, queryClient]);

  return (
    <p ref={regionRef} role="status" aria-live="polite" className="sr-only" />
  );
}
