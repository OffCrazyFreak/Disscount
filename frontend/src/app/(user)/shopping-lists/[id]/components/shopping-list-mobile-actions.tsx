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
  return (
    <div className="flex sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="Dodatne opcije" variant="default">
            <MoreVertical className="size-6" />
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
                <BlockLoadingSpinner size={20} className="text-inherit" />
              ) : (
                <Share2 className="size-5" />
              )}
              <span>Podijeli popis</span>
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
                <BlockLoadingSpinner size={20} className="text-inherit" />
              ) : (
                <Copy className="size-5" />
              )}
              <span>Kopiraj popis</span>
            </DropdownMenuItem>
          )}

          {showEditButton && (
            <DropdownMenuItem
              onSelect={onEdit}
              className="cursor-pointer flex items-center gap-4"
            >
              <LucideClipboardEdit className="size-5" />
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
                <BlockLoadingSpinner size={20} className="text-inherit" />
              ) : (
                <Trash2 className="size-5 text-red-600" />
              )}
              <span>Obriši popis</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
