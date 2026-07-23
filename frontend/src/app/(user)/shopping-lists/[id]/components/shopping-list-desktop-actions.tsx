import { LucideClipboardEdit, Trash2, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { IShoppingListActionGroupProps } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";

export default function ShoppingListDesktopActions({
  showShareButton,
  showCopyButton,
  showEditButton,
  showDeleteButton,
  isSharing,
  isCopying,
  isDeleting,
  onShare,
  onCopy,
  onEdit,
  onDeleteClick,
}: IShoppingListActionGroupProps) {
  return (
    <div className={cn("hidden sm:flex items-center gap-1 sm:gap-2")}>
      {showShareButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="Podijeli popis"
              className="size-10 sm:size-12 shrink-0"
              onClick={onShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <BlockLoadingSpinner size={26} className="text-inherit" />
              ) : (
                <Share2 className="size-6 sm:size-7" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Podijeli popis
          </TooltipContent>
        </Tooltip>
      )}

      {showCopyButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="Kopiraj popis"
              className="size-10 sm:size-12 shrink-0"
              onClick={() => {
                onCopy();
              }}
              disabled={isCopying}
            >
              {isCopying ? (
                <BlockLoadingSpinner size={26} className="text-inherit" />
              ) : (
                <Copy className="size-6 sm:size-7" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Kopiraj popis
          </TooltipContent>
        </Tooltip>
      )}

      {showEditButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="Uredi popis"
              className="size-10 sm:size-12 shrink-0"
              onClick={onEdit}
            >
              <LucideClipboardEdit className="size-6 sm:size-7" />
            </Button>
          </TooltipTrigger>

          <TooltipContent className="px-2 py-1 text-xs">
            Uredi popis
          </TooltipContent>
        </Tooltip>
      )}

      {showDeleteButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="Obriši popis"
              className="size-10 sm:size-12 shrink-0 bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDeleteClick();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <BlockLoadingSpinner size={26} className="text-inherit" />
              ) : (
                <Trash2 className="size-6 sm:size-7" />
              )}
            </Button>
          </TooltipTrigger>

          <TooltipContent variant="destructive" className="px-2 py-1 text-xs">
            Obriši popis
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
