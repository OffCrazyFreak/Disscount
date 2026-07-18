import React, { MouseEvent, useState } from "react";
import {
  LucideClipboardEdit,
  Trash2,
  Copy,
  Share2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/block-loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { toast } from "sonner";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";

interface IShoppingListActionButtonsProps {
  shoppingList: ShoppingList;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showShareButton?: boolean;
  className?: string;
}

export default function ShoppingListActionButtons({
  shoppingList,
  showCopyButton = false,
  showEditButton = false,
  showDeleteButton = false,
  showShareButton = false,
}: IShoppingListActionButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { deleteShoppingListMutation, confirmDelete, handleCopy, isCopying } =
    useShoppingListMutations(shoppingList.id, shoppingList);

  function handleConfirmDelete() {
    confirmDelete();
    setIsDeleteDialogOpen(false);
  }

  function handleEdit() {
    openModalUrl({ name: "shopping-list", action: "edit", id: shoppingList.id });
  }

  async function handleShare() {
    setIsSharing(true);
    try {
      const shareText = formatShoppingListForSharing(shoppingList);
      await navigator.clipboard.writeText(shareText);
      toast.success("Popis je kopiran u međuspremnik!");
    } catch (error) {
      console.error("Error sharing shopping list:", error);
      toast.error("Greška pri kopiranju popisa");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Obriši popis za kupnju"
        description={`Jesi li siguran da želiš obrisati popis "${shoppingList.title}"? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteShoppingListMutation.isPending}
      />

      {/* Desktop View - Show all buttons */}
      <div className={cn("hidden sm:flex items-center gap-1 sm:gap-2")}>
        {showShareButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Podijeli popis"
                className="size-10 sm:size-12 shrink-0"
                onClick={handleShare}
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
                  handleCopy();
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
                onClick={handleEdit}
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
                  setIsDeleteDialogOpen(true);
                }}
                disabled={deleteShoppingListMutation.isPending}
              >
                {deleteShoppingListMutation.isPending ? (
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

      {/* Mobile View - Show dropdown menu */}
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
                onSelect={handleShare}
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
                  handleCopy();
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
                onSelect={handleEdit}
                className="cursor-pointer flex items-center gap-4"
              >
                <LucideClipboardEdit className="size-5" />
                <span>Uredi popis</span>
              </DropdownMenuItem>
            )}

            {showDeleteButton && (
              <DropdownMenuItem
                onSelect={() => {
                  setIsDeleteDialogOpen(true);
                }}
                className="cursor-pointer flex items-center gap-4 text-red-600"
                disabled={deleteShoppingListMutation.isPending}
              >
                {deleteShoppingListMutation.isPending ? (
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
    </>
  );
}
