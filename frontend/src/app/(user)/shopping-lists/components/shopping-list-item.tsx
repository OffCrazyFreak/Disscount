"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingListDto } from "@/lib/api/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Globe,
  Lock,
  Edit,
  Calendar,
  ListChecks,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/utils/strings";
import { Activity } from "react";
import DeleteListDialog from "@/app/(user)/shopping-lists/components/forms/delete-shopping-list-dialog";
import { shoppingListService } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface IShoppingListListItemProps {
  shoppingList: ShoppingListDto;
  handleEdit: (shoppingList: ShoppingListDto) => void;
}

export default function ShoppingListListItem({
  shoppingList,
  handleEdit,
}: IShoppingListListItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteShoppingListMutation =
    shoppingListService.useDeleteShoppingList();
  const checkedCount = shoppingList.items.filter(
    (item) => item.isChecked
  ).length;
  const totalCount = shoppingList.items.length;

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteShoppingListMutation.mutate(shoppingList.id, {
      onSuccess: () => {
        toast.success("Popis za kupnju je uspješno obrisan!");
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        setIsDeleteDialogOpen(false);
      },
      onError: (error: Error) => {
        toast.error(
          error.message ||
            "Greška pri brisanju popisa za kupnju. Pokušajte ponovno."
        );
      },
    });
  };

  return (
    <>
      <DeleteListDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteShoppingListMutation.isPending}
        listTitle={shoppingList.title}
      />

      <Card className="p-4 hover:shadow-md transition-shadow">
        {/* Overlay link to make whole card clickable */}
        <Link
          href={`/shopping-lists/${shoppingList.id}`}
          className="flex items-stretch sm:items-center justify-between gap-4 flex-col sm:flex-row"
        >
          <div className="flex items-center justify-between gap-4 min-w-0 flex-1">
            {/* Title */}
            <h3 className="font-bold text-lg truncate">{shoppingList.title}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0" tabIndex={0}>
                  {shoppingList.isPublic ? (
                    <Globe className="size-5 text-primary" />
                  ) : (
                    <Lock className="size-5 text-gray-600" />
                  )}
                </div>
              </TooltipTrigger>

              <TooltipContent sideOffset={4}>
                {shoppingList.isPublic ? "Popis je javan" : "Popis je privatan"}
              </TooltipContent>
            </Tooltip>{" "}
          </div>

          {/* Right-side meta */}
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            {/* Updated Date */}
            <div className="flex items-start pt-1 gap-2 text-sm text-gray-600">
              <Calendar className="size-5" />
              <span>{formatDate(shoppingList.updatedAt)}</span>
            </div>
            {/* Item Count */}
            <div className="flex items-start pt-1 gap-2 text-sm text-gray-600">
              <ListChecks className="size-5" />
              <span>
                {checkedCount}/{totalCount}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {/* Edit Button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEdit(shoppingList);
                }}
                className="flex-shrink-0 size-9 bg-primary text-white rounded-sm grid place-items-center z-20"
              >
                <Edit className="size-5 text-white" />
              </Button>

              {/* Delete Button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex-shrink-0 size-9 bg-red-600 hover:bg-red-700 text-white rounded-sm grid place-items-center z-20"
                disabled={deleteShoppingListMutation.isPending}
              >
                {deleteShoppingListMutation.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Trash2 className="size-5 text-white" />
                )}
              </Button>
            </div>
          </div>
        </Link>
      </Card>
    </>
  );
}
