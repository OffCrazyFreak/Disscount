import {
  LucideClipboardEdit,
  Trash2,
  Copy,
  Share2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useTapToOpen from "@/hooks/use-tap-to-open";
import { LOADING_LABELS } from "@/constants/loading-labels";
import type { IShoppingListActionGroupProps } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";

export default function ShoppingListMobileActions({
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
  const { rootProps, triggerProps } = useTapToOpen();

  // The label is the whole affordance here, so it swaps rather than sitting still
  // behind a spinner.
  const shareLabel = isSharing ? LOADING_LABELS.sharing : "Podijeli popis";
  const copyLabel = isCopying ? LOADING_LABELS.copying : "Kopiraj popis";
  const deleteLabel = isDeleting ? LOADING_LABELS.deleting : "Obriši popis";

  return (
    <div className="flex sm:hidden">
      <DropdownMenu {...rootProps}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            aria-label="Dodatne opcije"
            variant="primary"
            {...triggerProps}
          >
            <MoreVertical aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          {showShareButton && (
            <DropdownMenuItem
              onSelect={onShare}
              className="cursor-pointer flex items-center gap-4"
              disabled={isSharing}
            >
              {isSharing ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <Share2 aria-hidden="true" className="size-6" />
              )}
              <span>{shareLabel}</span>
            </DropdownMenuItem>
          )}

          {showCopyButton && (
            <DropdownMenuItem
              onSelect={() => {
                onCopy();
              }}
              className="cursor-pointer flex items-center gap-4"
              disabled={isCopying}
            >
              {isCopying ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <Copy aria-hidden="true" className="size-6" />
              )}
              <span>{copyLabel}</span>
            </DropdownMenuItem>
          )}

          {showEditButton && (
            <DropdownMenuItem
              onSelect={onEdit}
              className="cursor-pointer flex items-center gap-4"
            >
              <LucideClipboardEdit aria-hidden="true" className="size-6" />
              <span>Uredi popis</span>
            </DropdownMenuItem>
          )}

          {showDeleteButton && (
            <DropdownMenuItem
              onSelect={() => {
                onDeleteClick();
              }}
              className="cursor-pointer flex items-center gap-4 text-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <BlockLoadingSpinner size={24} className="text-inherit" />
              ) : (
                <Trash2 aria-hidden="true" className="size-6 text-red-600" />
              )}
              <span>{deleteLabel}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
