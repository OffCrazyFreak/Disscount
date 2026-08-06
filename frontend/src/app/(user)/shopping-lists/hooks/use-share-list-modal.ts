"use client";

import { useState } from "react";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { LinkAccess } from "@/lib/api/types";
import { shareOrCopy } from "@/utils/browser/share";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { shareListUrl } from "@/utils/shopping-list-links";
import { useOnlineStatus } from "@/hooks/use-online-status";

const SAVED_MESSAGE: Record<LinkAccess, string> = {
  NONE: "Dijeljenje je isključeno. Poveznica više ne vrijedi.",
  VIEW: "Dijeljenje je uključeno. Poveznica je spremna.",
  SHOP: "Dijeljenje je uključeno. Poveznica je spremna.",
  EDIT: "Dijeljenje je uključeno. Poveznica je spremna.",
};

/**
 * Share settings save on change rather than behind a submit button: the server mints the
 * token, so there is no link to show until a save has come back.
 */
export function useShareListModal(id: string) {
  const [pendingAccess, setPendingAccess] = useState<LinkAccess | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const isOnline = useOnlineStatus();

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const updateMutation = shoppingListService.useUpdateShoppingList();

  const shoppingList = listQuery.data ?? null;
  // The pending value wins while the save is in flight, so the control stays where the
  // user put it instead of snapping back for the whole round trip.
  const linkAccess: LinkAccess =
    pendingAccess ?? shoppingList?.linkAccess ?? "NONE";
  const shareUrl = shoppingList?.shareToken
    ? shareListUrl(shoppingList.shareToken)
    : null;

  const isSaving = updateMutation.isPending && isOnline;

  function setLinkAccess(next: LinkAccess) {
    // isSaving, not isPending: offline the mutation pauses rather than settles, so
    // isPending stays true forever and this guard would swallow every later change
    // while the controls stayed enabled and said nothing.
    if (!shoppingList || next === linkAccess || isSaving) return;

    setPendingAccess(next);
    setSavedMessage("");

    // PUT carries the whole request, so the current title has to ride along or the
    // server would reject it as blank.
    updateMutation.mutate(
      { id, data: { title: shoppingList.title, linkAccess: next } },
      {
        onSuccess: () => setSavedMessage(SAVED_MESSAGE[next]),
        onError: () =>
          toast.error("Promjena dijeljenja nije spremljena. Pokušaj ponovno."),
        onSettled: () => setPendingAccess(null),
      },
    );
  }

  // No pending state on purpose. Nothing here is fetched, and shareOrCopy
  // documents why a flag cleared on completion strands the button spinning.
  async function handleTextShare() {
    if (!shoppingList) return;

    try {
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text: formatShoppingListForSharing(shoppingList),
      });

      if (outcome === "copied") toast.success("Tekst popisa je kopiran");
      if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
    } catch {
      // shareOrCopy resolves an outcome rather than throwing, but appUrl() throws on a
      // misconfigured NEXT_PUBLIC_APP_URL. Wired to onClick and never awaited, so
      // without this the failure is invisible.
      toast.error("Dijeljenje nije uspjelo");
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    linkAccess,
    setLinkAccess,
    isSaving,
    isOffline: !isOnline,
    savedMessage,
    shareUrl,
    handleTextShare,
  };
}
