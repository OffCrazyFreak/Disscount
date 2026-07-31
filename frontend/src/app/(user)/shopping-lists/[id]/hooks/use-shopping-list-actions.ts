import { useState } from "react";
import { toast } from "sonner";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { shareOrCopy } from "@/utils/browser/share";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { shareListUrl } from "@/app/(user)/shopping-lists/utils/share-list-url";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

export interface IShoppingListActionGroupProps {
  showShareButton: boolean;
  showCopyButton: boolean;
  showEditButton: boolean;
  showDeleteButton: boolean;
  isSharing: boolean;
  isCopying: boolean;
  isDeleting: boolean;
  onShare: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
}

export function useShoppingListActions(shoppingList: ShoppingList) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { deleteShoppingListMutation, confirmDelete, handleCopy, isCopying } =
    useShoppingListMutations(shoppingList.id, shoppingList);

  function handleConfirmDelete() {
    confirmDelete();
    setIsDeleteDialogOpen(false);
  }

  function handleEdit() {
    openModalUrl({
      name: "shopping-list",
      action: "edit",
      id: shoppingList.id,
    });
  }

  const { canManageShare } = resolveShoppingListAccess(shoppingList.myAccess);

  async function handleShare() {
    // The owner gets the settings panel, where the link is created and revoked. Everyone
    // else can still pass the list on: either the link they already hold, or plain text.
    if (canManageShare) {
      openModalUrl({
        name: "shopping-list",
        action: "share",
        id: shoppingList.id,
      });
      return;
    }

    setIsSharing(true);
    try {
      const text = formatShoppingListForSharing(shoppingList);
      const url = shoppingList.shareToken
        ? shareListUrl(shoppingList.shareToken)
        : undefined;
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text,
        ...(url ? { url } : {}),
      });

      if (outcome === "copied") {
        toast.success(
          url ? "Poveznica je kopirana" : "Tekst popisa je kopiran",
        );
      }
      if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
    } finally {
      setIsSharing(false);
    }
  }

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting: deleteShoppingListMutation.isPending,
    isSharing,
    isCopying,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  };
}
