import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { useShoppingListActions } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListActionRow from "@/app/(user)/shopping-lists/[id]/components/shopping-list-action-row";

interface IShoppingListActionButtonsProps {
  shoppingList: ShoppingList;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  /** Off, the row hides below `sm` and the surface has to carry the actions itself, the way the card does with its long press. */
  showOnMobile?: boolean;
  className?: string;
}

export default function ShoppingListActionButtons({
  shoppingList,
  showCopyButton = false,
  showEditButton = false,
  showDeleteButton = false,
  showShareButton = false,
  showOnMobile = false,
  className,
}: IShoppingListActionButtonsProps) {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    isCopying,
    isShared,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  } = useShoppingListActions(shoppingList);

  const groupProps = {
    showShareButton,
    isShared,
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

      <ShoppingListActionRow
        {...groupProps}
        visibleOnMobile={showOnMobile}
        className={className}
      />
    </>
  );
}
