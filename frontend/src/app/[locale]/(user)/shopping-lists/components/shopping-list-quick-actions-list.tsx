"use client";

import { Copy, LucideClipboardEdit, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import QuickActionItem from "@/components/custom/common/quick-action-item";
import Share2Pen from "@/components/custom/icons/share-2-pen";

interface IShoppingListQuickActionsListProps {
  isOwner: boolean;
  /** Marks the share row as "already shared, this edits it" rather than "share this". */
  isShared: boolean;
  onShare: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * A shopping list's four actions as sheet rows. Share and copy are open to
 * anyone holding the link, since copy creates a list under the viewer's own
 * account, while edit and delete resolve through the owner and would only fail.
 */
export default function ShoppingListQuickActionsList({
  isOwner,
  isShared,
  onShare,
  onCopy,
  onEdit,
  onDelete,
}: IShoppingListQuickActionsListProps) {
  const t = useTranslations("shoppingLists");

  return (
    <>
      {isOwner && (
        <QuickActionItem
          icon={LucideClipboardEdit}
          label={t("quickActions.edit")}
          onSelect={onEdit}
        />
      )}

      <QuickActionItem
        icon={Copy}
        label={t("quickActions.copy")}
        onSelect={onCopy}
      />

      <QuickActionItem
        icon={isShared ? Share2Pen : Share2}
        label={
          isShared ? t("quickActions.editSharing") : t("quickActions.share")
        }
        onSelect={onShare}
      />

      {isOwner && (
        <QuickActionItem
          icon={Trash2}
          label={t("quickActions.delete")}
          variant="destructive"
          onSelect={onDelete}
        />
      )}
    </>
  );
}
