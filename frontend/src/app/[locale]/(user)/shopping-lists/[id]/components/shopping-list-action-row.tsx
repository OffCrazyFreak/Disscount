import { useTranslations } from "next-intl";
import { LucideClipboardEdit, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import ShoppingListIconAction from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-icon-action";
import ShoppingListShareAction from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-share-action";
import ShoppingListDeleteAction from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-delete-action";
import type { IShoppingListActionGroupProps } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";

interface IShoppingListActionRowProps extends IShoppingListActionGroupProps {
  visibleOnMobile?: boolean;
  className?: string;
}

export default function ShoppingListActionRow({
  showShareButton,
  isShared,
  showCopyButton,
  showEditButton,
  showDeleteButton,
  isDeleting,
  onShare,
  onCopy,
  onEdit,
  onDeleteClick,
  visibleOnMobile = false,
  className,
}: IShoppingListActionRowProps) {
  const t = useTranslations("shoppingListDetail");
  const copyLabel = t("actions.copy");

  return (
    <div
      className={cn(
        "items-center gap-1 sm:gap-2",
        visibleOnMobile ? "flex" : "hidden sm:flex",
        className,
      )}
    >
      {showEditButton && (
        <ShoppingListIconAction label={t("actions.edit")} onClick={onEdit}>
          <LucideClipboardEdit aria-hidden="true" />
        </ShoppingListIconAction>
      )}

      {showCopyButton && (
        <ShoppingListIconAction
          label={copyLabel}
          onClick={() => {
            onCopy();
          }}
        >
          <Copy aria-hidden="true" />
        </ShoppingListIconAction>
      )}

      {showShareButton && (
        <ShoppingListShareAction isShared={isShared} onShare={onShare} />
      )}

      {showDeleteButton && (
        <ShoppingListDeleteAction
          isDeleting={isDeleting}
          onDeleteClick={onDeleteClick}
        />
      )}
    </div>
  );
}
