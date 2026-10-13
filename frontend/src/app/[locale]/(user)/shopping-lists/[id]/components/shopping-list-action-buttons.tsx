import { useTranslations } from "next-intl";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import { useShoppingListActions } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListActionRow from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-action-row";

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
  const t = useTranslations("shoppingListDetail");

  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
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
        title={t("actions.deleteTitle")}
        description={t("actions.deleteDescription", {
          title: shoppingList.title,
        })}
        confirmLabel={t("actions.deleteConfirm")}
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
