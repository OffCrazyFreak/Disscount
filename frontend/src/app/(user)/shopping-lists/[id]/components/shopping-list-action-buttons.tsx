import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useShoppingListActions } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListDesktopActions from "@/app/(user)/shopping-lists/[id]/components/shopping-list-desktop-actions";
import ShoppingListMobileActions from "@/app/(user)/shopping-lists/[id]/components/shopping-list-mobile-actions";

interface IShoppingListActionButtonsProps {
  shoppingList: ShoppingList;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  className?: string;
}

export default function ShoppingListActionButtons({
  shoppingList,
  showCopyButton = false,
  showEditButton = false,
  showDeleteButton = false,
  showShareButton = false,
}: IShoppingListActionButtonsProps) {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    isSharing,
    isCopying,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  } = useShoppingListActions(shoppingList);

  const groupProps = {
    showShareButton,
    showCopyButton,
    showEditButton,
    showDeleteButton,
    isSharing,
    isCopying,
    isDeleting,
    onShare: handleShare,
    onCopy: handleCopy,
    onEdit: handleEdit,
    onDeleteClick: () => setIsDeleteDialogOpen(true),
  };

  return (
    <>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Obriši popis za kupnju"
        description={`Jesi li siguran da želiš obrisati popis "${shoppingList.title}"? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <ShoppingListDesktopActions {...groupProps} />

      <ShoppingListMobileActions {...groupProps} />
    </>
  );
}
