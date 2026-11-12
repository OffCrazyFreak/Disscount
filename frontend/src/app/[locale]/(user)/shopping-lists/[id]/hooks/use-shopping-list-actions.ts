import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import {
  openModalUrl,
  type IOpenModalOptions,
} from "@/lib/modal/modal-navigation";
import { shareOrCopy } from "@/utils/browser/share";
import { useShoppingListMutations } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { useListShareText } from "@/app/[locale]/(user)/shopping-lists/hooks/use-list-share-text";
import { shareListUrl } from "@/utils/shopping-list-links";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";

export interface IShoppingListActionGroupProps {
  showShareButton: boolean;
  /** Marks the share control as "already shared, this edits it" rather than "share this". */
  isShared: boolean;
  showCopyButton: boolean;
  showEditButton: boolean;
  showDeleteButton: boolean;
  isDeleting: boolean;
  onShare: (options?: IOpenModalOptions) => void;
  onCopy: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
}

export function useShoppingListActions(shoppingList: ShoppingList) {
  const t = useTranslations("shoppingListDetail");
  const listShareText = useListShareText();
  const locale = useLocale();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { deleteShoppingListMutation, confirmDelete, handleCopy } =
    useShoppingListMutations(shoppingList.id, shoppingList);

  // Returns the promise so a caller unmounting on completion does not tear the mutation down mid-flight.
  async function handleConfirmDelete() {
    setIsDeleteDialogOpen(false);
    await confirmDelete();
  }

  // Takes options because closeModalUrl's async history.back() would lose a push made straight after.
  function handleEdit(options?: IOpenModalOptions) {
    openModalUrl(
      {
        name: "shopping-list",
        action: "edit",
        id: shoppingList.id,
      },
      options,
    );
  }

  const { canManageShare } = resolveShoppingListAccess(shoppingList.myAccess);

  // No pending state, because shareOrCopy documents why a cleared flag strands the button spinning.
  async function handleShare(options?: IOpenModalOptions) {
    // Only the owner gets the settings panel; everyone else can still pass the list on, by link or plain text.
    if (canManageShare) {
      openModalUrl(
        {
          name: "shopping-list",
          action: "share",
          id: shoppingList.id,
        },
        options,
      );
      return;
    }

    try {
      // Whether the link opens is the owner's call through the share modal, not something to withhold here.
      const text = listShareText(shoppingList);
      const url = shareListUrl(shoppingList.id, locale);
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text,
        url,
      });

      if (outcome === "copied") toast.success(t("toasts.linkCopied"));
      if (outcome === "failed") toast.error(t("toasts.shareFailed"));
    } catch {
      // appUrl() can throw on a bad NEXT_PUBLIC_APP_URL, and onClick never awaits, so the failure would be invisible.
      toast.error(t("toasts.shareFailed"));
    }
  }

  // linkAccess is null for non-owners, so a recipient keeps the plain share icon, matching their button.
  const isShared =
    !!shoppingList.linkAccess && shoppingList.linkAccess !== "NONE";

  return {
    canManageShare,
    isShared,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting: deleteShoppingListMutation.isPending,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  };
}
