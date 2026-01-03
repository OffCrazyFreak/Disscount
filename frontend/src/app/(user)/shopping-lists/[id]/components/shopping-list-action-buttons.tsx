import React, { MouseEvent, useState } from "react";
import { LucideClipboardEdit, Trash2, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import ShoppingListModal from "@/app/(user)/shopping-lists/components/forms/shopping-list-modal";
import DeleteListDialog from "@/app/(user)/shopping-lists/components/forms/delete-shopping-list-dialog";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";

interface ShoppingListActionButtonsProps {
  shoppingList: ShoppingList;
  showCopyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  className?: string;
}

export default function ShoppingListActionButtons({
  shoppingList,
  showCopyButton = true,
  showEditButton = true,
  showDeleteButton = true,
  className,
}: ShoppingListActionButtonsProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { deleteShoppingListMutation, confirmDelete, handleCopy, isCopying } =
    useShoppingListMutations(shoppingList.id, shoppingList);

  function handleConfirmDelete() {
    confirmDelete();
    setIsDeleteDialogOpen(false);
  }

  async function handleModalSuccess() {
    await queryClient.invalidateQueries({
      queryKey: ["shoppingLists", shoppingList.id],
    });
  }

  return (
    <>
      <ShoppingListModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleModalSuccess}
        shoppingList={shoppingList}
      />

      <DeleteListDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteShoppingListMutation.isPending}
        listTitle={shoppingList.title}
      />

      <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
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
                  <Loader2 className="size-6 sm:size-7 animate-spin" />
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
                onClick={() => {
                  setIsModalOpen(true);
                }}
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
                  <Loader2 className="size-6 sm:size-7 animate-spin" />
                ) : (
                  <Trash2 className="size-6 sm:size-7" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Obriši popis
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}
