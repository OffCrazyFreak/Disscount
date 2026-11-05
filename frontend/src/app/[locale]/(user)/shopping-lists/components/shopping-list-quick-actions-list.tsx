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

/** Share and copy suit anyone with the link, as copy lands on the viewer's account; the rest would fail. */
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
