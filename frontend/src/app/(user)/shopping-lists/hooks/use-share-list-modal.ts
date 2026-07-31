"use client";

import { useState } from "react";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { LinkAccess } from "@/lib/api/types";
import { shareOrCopy } from "@/utils/browser/share";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { shareListUrl } from "@/app/(user)/shopping-lists/utils/share-list-url";

/**
 * Share settings save on change rather than behind a submit button: the server mints the
 * token, so there is no link to show until a save has come back.
 */
export function useShareListModal(id: string) {
  const [isSharingText, setIsSharingText] = useState(false);

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const updateMutation = shoppingListService.useUpdateShoppingList();

  const shoppingList = listQuery.data ?? null;
  const linkAccess: LinkAccess = shoppingList?.linkAccess ?? "NONE";
  const shareUrl = shoppingList?.shareToken
    ? shareListUrl(shoppingList.shareToken)
    : null;

  function setLinkAccess(next: LinkAccess) {
    if (!shoppingList || next === linkAccess) return;

    // PUT carries the whole request, so the current title has to ride along or the
    // server would reject it as blank.
    updateMutation.mutate(
      { id, data: { title: shoppingList.title, linkAccess: next } },
      {
        onError: () =>
          toast.error("Promjena dijeljenja nije spremljena. Pokušaj ponovno."),
      },
    );
  }

  async function handleTextShare() {
    if (!shoppingList) return;

    setIsSharingText(true);
    try {
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text: formatShoppingListForSharing(shoppingList),
      });

      if (outcome === "copied") toast.success("Tekst popisa je kopiran");
      if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
    } finally {
      setIsSharingText(false);
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    linkAccess,
    setLinkAccess,
    isSaving: updateMutation.isPending,
    shareUrl,
    handleTextShare,
    isSharingText,
  };
}
