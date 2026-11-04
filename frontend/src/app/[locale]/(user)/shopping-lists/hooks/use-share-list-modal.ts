"use client";

import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { shoppingListService } from "@/lib/api";
import { isDeadListLink } from "@/lib/api/shopping-lists/is-dead-list-link";
import type { LinkAccess } from "@/lib/api/types";
import { shareOrCopy } from "@/utils/browser/share";
import { useListShareText } from "@/app/[locale]/(user)/shopping-lists/hooks/use-list-share-text";
import { shareListUrl } from "@/utils/shopping-list-links";
import { useOnlineStatus } from "@/hooks/use-online-status";

/** Saves on change because there is nothing to confirm: the URL exists either way, and the modal only asks what holding it grants. */
export function useShareListModal(id: string) {
  const t = useTranslations("shoppingLists");
  const locale = useLocale();
  const isOnline = useOnlineStatus();
  const listShareText = useListShareText();

  const listQuery = shoppingListService.useGetShoppingListById(id);
  const updateMutation = shoppingListService.useUpdateShoppingList();

  // A failed refetch keeps the cached list; only a 404 means it is gone, as on the list page.
  const shoppingList = isDeadListLink(listQuery.error)
    ? null
    : (listQuery.data ?? null);

  // No local mirror: useUpdateShoppingList writes optimistically in onMutate, so the cache is already correct here.
  const linkAccess: LinkAccess = shoppingList?.linkAccess ?? "NONE";

  // Not built during render, because appUrl() throws on a bad NEXT_PUBLIC_APP_URL and would take the whole modal down, not one button.
  const canShareLink = linkAccess !== "NONE";

  // isSaving, not isPending: offline the mutation pauses, so isPending stays true and the controls would sit disabled with no explanation.
  const isSaving = updateMutation.isPending && isOnline;

  function setLinkAccess(next: LinkAccess) {
    if (!shoppingList || next === linkAccess || isSaving) return;

    // PUT carries the whole request, so the current title rides along or the server would reject it as blank.
    updateMutation.mutate(
      { id, data: { title: shoppingList.title, linkAccess: next } },
      {
        // The toast has its own live region, so the modal does not announce success too and make a screen reader say it twice.
        onSuccess: () => toast.success(t("shareModal.settingsUpdatedToast")),
        onError: () => toast.error(t("shareModal.settingsFailedToast")),
      },
    );
  }

  // No pending state, because shareOrCopy documents why a flag cleared on completion strands the button spinning.
  async function handleLinkShare() {
    if (!canShareLink || !shoppingList) return;

    try {
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        url: shareListUrl(shoppingList.id, locale),
      });

      if (outcome === "copied") toast.success(t("shareModal.linkCopiedToast"));
      if (outcome === "failed") toast.error(t("shareModal.failedToast"));
    } catch {
      toast.error(t("shareModal.failedToast"));
    }
  }

  async function handleTextShare() {
    if (!shoppingList) return;

    try {
      // Text only, because a url would flip shareOrCopy's clipboard fallback to copy a bare link instead of the list it promises.
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text: listShareText(shoppingList),
      });

      if (outcome === "copied") toast.success(t("shareModal.textCopiedToast"));
      if (outcome === "failed") toast.error(t("shareModal.failedToast"));
    } catch {
      // shareOrCopy resolves rather than throws, but appUrl() throws on a bad NEXT_PUBLIC_APP_URL, and onClick never awaits, so the failure would be invisible.
      toast.error(t("shareModal.failedToast"));
    }
  }

  return {
    shoppingList,
    isLoading: listQuery.isLoading,
    linkAccess,
    setLinkAccess,
    isSaving,
    isOffline: !isOnline,
    canShareLink,
    handleLinkShare,
    handleTextShare,
  };
}
