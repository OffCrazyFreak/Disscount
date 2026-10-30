"use client";

import { useTranslations } from "next-intl";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShareListModal } from "@/app/[locale]/(user)/shopping-lists/hooks/use-share-list-modal";
import ShareListPanel from "@/app/[locale]/(user)/shopping-lists/components/forms/share-list-panel";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

interface IShareListModalProps {
  open: boolean;
  id: string;
}

/** No footer on purpose: every change saves itself, so there is nothing to confirm. */
export default function ShareListModal({ open, id }: IShareListModalProps) {
  const t = useTranslations("shoppingLists");
  const {
    shoppingList,
    isLoading,
    isError,
    linkAccess,
    setLinkAccess,
    isSaving,
    isOffline,
    canShareLink: isLevelShareable,
    handleLinkShare,
    handleTextShare,
  } = useShareListModal(id);

  // The list route serves link visitors as well as its owner, so a signed-in recipient can
  // reach this modal by URL. Only the owner may see or change who else has access.
  const canManageShare = resolveShoppingListAccess(
    shoppingList?.myAccess,
  ).canManageShare;

  return (
    <ModalShell
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeModalUrl()}
      title={t("shareModal.title")}
      description={t("shareModal.description")}
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !shoppingList || !canManageShare ? (
        <p className="text-sm text-muted-foreground">{t("modal.notFound")}</p>
      ) : (
        <ShareListPanel
          linkAccess={linkAccess}
          onLevelChange={setLinkAccess}
          isSaving={isSaving}
          isOffline={isOffline}
          isLevelShareable={isLevelShareable}
          onLinkShare={handleLinkShare}
          onTextShare={handleTextShare}
        />
      )}
    </ModalShell>
  );
}
