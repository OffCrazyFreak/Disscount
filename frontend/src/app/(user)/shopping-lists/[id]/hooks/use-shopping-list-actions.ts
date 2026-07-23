import { useState } from "react";
import { toast } from "sonner";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";

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

  async function handleShare() {
    setIsSharing(true);
    try {
      const shareText = formatShoppingListForSharing(shoppingList);
      await navigator.clipboard.writeText(shareText);
      toast.success("Popis je kopiran u međuspremnik!");
    } catch (error) {
      console.error("Error sharing shopping list:", error);
      toast.error("Greška pri kopiranju popisa");
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
