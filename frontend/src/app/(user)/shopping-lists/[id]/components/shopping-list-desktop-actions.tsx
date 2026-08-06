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
import type { IShoppingListActionGroupProps } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";

interface IShoppingListDesktopActionsProps extends IShoppingListActionGroupProps {
  visibleOnMobile?: boolean;
  className?: string;
}

export default function ShoppingListDesktopActions({
  showShareButton,
  isShared,
  showCopyButton,
  showEditButton,
  showDeleteButton,
  isCopying,
  isDeleting,
  onShare,
  onCopy,
  onEdit,
  onDeleteClick,
  visibleOnMobile = false,
  className,
}: IShoppingListDesktopActionsProps) {
  // Icon-only, so the spinner is the whole visual and the accessible name carries the
  // pending copy. The tooltip has to say the same thing or the two contradict each other.
  // Share has no pending state: it either opens a modal or hands off to the OS sheet.
  const shareLabel = isShared ? "Uredi dijeljenje popisa" : "Podijeli popis";
  const copyLabel = isCopying ? LOADING_LABELS.copying : "Kopiraj popis";
  const deleteLabel = isDeleting ? LOADING_LABELS.deleting : "Obriši popis";

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
              aria-label="Uredi popis"
              className="shrink-0"
              onClick={onEdit}
            >
              <LucideClipboardEdit aria-hidden="true" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Uredi popis
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
              disabled={isCopying}
            >
              {isCopying ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <Copy aria-hidden="true" />
              )}
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
                <BlockLoadingSpinner size={24} className="text-inherit" />
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
