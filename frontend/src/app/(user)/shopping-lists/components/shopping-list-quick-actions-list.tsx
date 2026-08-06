"use client";

import { Copy, LucideClipboardEdit, Share2, Trash2 } from "lucide-react";

import QuickActionItem from "@/components/custom/common/quick-action-item";

interface IShoppingListQuickActionsListProps {
  isOwner: boolean;
  isCopying: boolean;
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
  isCopying,
  onShare,
  onCopy,
  onEdit,
  onDelete,
}: IShoppingListQuickActionsListProps) {
  return (
    <>
      <QuickActionItem
        icon={Share2}
        label="Podijeli popis"
        onSelect={onShare}
      />

      <QuickActionItem
        icon={Copy}
        label="Kopiraj popis"
        onSelect={onCopy}
        loading={isCopying}
      />

      {isOwner && (
        <QuickActionItem
          icon={LucideClipboardEdit}
          label="Uredi popis"
          onSelect={onEdit}
        />
      )}

      {isOwner && (
        <QuickActionItem
          icon={Trash2}
          label="Obriši popis"
          variant="destructive"
          onSelect={onDelete}
        />
      )}
    </>
  );
}
