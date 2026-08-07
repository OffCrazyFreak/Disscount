"use client";

import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import type { LinkAccess } from "@/lib/api/types";
import { shareOrCopy } from "@/utils/browser/share";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { shareListUrl } from "@/utils/shopping-list-links";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Share settings save on change rather than behind a submit button. There is nothing to
 * confirm: the URL is the list's own and exists either way, so the only question the
 * modal asks is what holding it grants.
 */
export function useShareListModal(id: string) {
  const isOnline = useOnlineStatus();

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const updateMutation = shoppingListService.useUpdateShoppingList();

  const shoppingList = listQuery.data ?? null;

  // Read straight from the cache, with no local mirror. useUpdateShoppingList writes the
  // new value optimistically in onMutate, so the cache is already correct here and there
  // is no second source to fall back to mid-save.
  const linkAccess: LinkAccess = shoppingList?.linkAccess ?? "NONE";

  // Not built during render. shareListUrl calls appUrl(), which throws on a misconfigured
  // NEXT_PUBLIC_APP_URL, and a throw here would take the whole modal down rather than the
  // one button that needs an origin. The handlers below build it inside their try/catch.
  const canShareLink = linkAccess !== "NONE";

  // isSaving, not isPending: offline the mutation pauses rather than settles, so isPending
  // stays true forever and the controls would sit disabled with nothing explaining why.
  const isSaving = updateMutation.isPending && isOnline;

  function setLinkAccess(next: LinkAccess) {
    if (!shoppingList || next === linkAccess || isSaving) return;

    // PUT carries the whole request, so the current title has to ride along or the
    // server would reject it as blank.
    updateMutation.mutate(
      { id, data: { title: shoppingList.title, linkAccess: next } },
      {
        // The toast is the confirmation. It carries its own live region, so the modal does
        // not also announce success and make a screen reader say it twice.
        onSuccess: () => toast.success("Postavke dijeljenja popisa ažurirane."),
        onError: () =>
          toast.error("Promjena dijeljenja nije spremljena. Pokušaj ponovno."),
      },
    );
  }

  // No pending state on either handler. Nothing here is fetched, and shareOrCopy
  // documents why a flag cleared on completion strands the button spinning.
  async function handleLinkShare() {
    if (!canShareLink || !shoppingList) return;

    try {
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        url: shareListUrl(shoppingList.id),
      });

      if (outcome === "copied") toast.success("Poveznica je kopirana");
      if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
    } catch {
      toast.error("Dijeljenje nije uspjelo");
    }
  }

  async function handleTextShare() {
    if (!shoppingList) return;

    try {
      // Text only, deliberately. Adding a url would flip shareOrCopy's clipboard fallback,
      // which prefers url over text, so the button would copy a bare link instead of the
      // list it promises.
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
    canShareLink,
    handleLinkShare,
    handleTextShare,
  };
}
