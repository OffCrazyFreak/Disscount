import { useTranslations } from "next-intl";
import { LucideClipboardEdit, Trash2, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Share2Pen from "@/components/custom/icons/share-2-pen";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LOADING_LABELS } from "@/constants/loading-labels";
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
  const tShell = useTranslations("shell");

  // Icon-only, so the spinner is the whole visual and the accessible name carries the
  // pending state. The tooltip has to say the same thing or the two contradict each
  // other. Neither share nor copy has one: both only open something.
  const shareLabel = isShared ? t("actions.editShare") : t("actions.share");
  const copyLabel = t("actions.copy");
  const deleteLabel = isDeleting
    ? tShell(LOADING_LABELS.deleting)
    : t("actions.delete");

  return (
    <div
      className={cn(
        "items-center gap-1 sm:gap-2",
        visibleOnMobile ? "flex" : "hidden sm:flex",
        className,
      )}
    >
      {showEditButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label={t("actions.edit")}
              className="shrink-0"
              onClick={onEdit}
            >
              <LucideClipboardEdit aria-hidden="true" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {t("actions.edit")}
          </TooltipContent>
        </Tooltip>
      )}

      {showCopyButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label={copyLabel}
              className="shrink-0"
              onClick={() => {
                onCopy();
              }}
            >
              <Copy aria-hidden="true" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {copyLabel}
          </TooltipContent>
        </Tooltip>
      )}

      {showShareButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label={shareLabel}
              className="shrink-0"
              onClick={() => onShare()}
            >
              {isShared ? (
                <Share2Pen aria-hidden="true" />
              ) : (
                <Share2 aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            {shareLabel}
          </TooltipContent>
        </Tooltip>
      )}

      {showDeleteButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label={deleteLabel}
              className="shrink-0 bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDeleteClick();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <BlockLoadingSpinner size={16} className="text-inherit" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent variant="destructive" className="px-2 py-1 text-xs">
            {deleteLabel}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
