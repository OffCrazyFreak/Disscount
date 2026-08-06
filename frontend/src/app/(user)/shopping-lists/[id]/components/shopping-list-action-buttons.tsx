import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { useShoppingListActions } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListDesktopActions from "@/app/(user)/shopping-lists/[id]/components/shopping-list-desktop-actions";
import ShoppingListMobileActions from "@/app/(user)/shopping-lists/[id]/components/shopping-list-mobile-actions";

interface IShoppingListActionButtonsProps {
  shoppingList: ShoppingList;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  /** Set when the page was reached through a share link, so share can offer that link. */
  shareToken?: string;
  mobilePresentation?: "menu" | "buttons" | "none";
  className?: string;
}

export default function ShoppingListActionButtons({
  shoppingList,
  showCopyButton = false,
  showEditButton = false,
  showDeleteButton = false,
  showShareButton = false,
  shareToken,
  mobilePresentation = "menu",
  className,
}: IShoppingListActionButtonsProps) {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    isCopying,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  } = useShoppingListActions(shoppingList, shareToken);

  const groupProps = {
    showShareButton,
    showCopyButton,
    showEditButton,
    showDeleteButton,
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
        description={`Sigurno želiš obrisati popis "${shoppingList.title}"? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <ShoppingListDesktopActions
        {...groupProps}
        visibleOnMobile={mobilePresentation === "buttons"}
        className={className}
      />

      {mobilePresentation === "menu" && (
        <ShoppingListMobileActions {...groupProps} />
      )}
    </>
  );
}
