"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Globe,
  Lock,
  CheckCheck,
  LucideClipboardEdit,
  ListChecks,
} from "lucide-react";
import { ShoppingListDto } from "@/lib/api/types";
import { ViewMode } from "@/typings/view-mode";
import { Button } from "@/components/ui/button-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/utils/strings";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface IShoppingListItemProps {
  shoppingList: ShoppingListDto;
  onEdit?: (shoppingList: ShoppingListDto) => void;
  viewMode?: ViewMode;
}

export default function ShoppingListItem({
  shoppingList,
  onEdit,
  viewMode = "list",
}: IShoppingListItemProps) {
  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  const variants: Record<string, string> = {
    list: "px-6 py-4",
    grid: "p-4",
  };

  return (
    <Card className={cn(variants[viewMode], "hover:shadow-md transition-all")}>
      <Link
        href={`/shopping-lists/${shoppingList.id}`}
        className={`flex items-center justify-between gap-4 cursor-pointer ${
          viewMode === "grid" ? "flex-col items-start" : ""
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Shopping List Icon */}
          {viewMode === "list" && (
            <div className="hidden sm:flex size-16 bg-primary/10 rounded-lg items-center justify-center shrink-0">
              <ListChecks className="size-8 text-primary" />
            </div>
          )}

          {/* Shopping List Info */}
          <div className="flex items-start justify-between flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate m-0 p-0">
                {shoppingList.title}
              </h3>

              <Tooltip>
                <TooltipTrigger>
                  {shoppingList.isPublic ? (
                    <Globe className="size-5 text-primary" />
                  ) : (
                    <Lock className="size-5 text-gray-400" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {shoppingList.isPublic ? "Javna lista" : "Privatna lista"}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-start flex-wrap gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>{formatDate(shoppingList.createdAt)}</span>
              </div>

              <div className="text-gray-400">
                {itemCount > 0 && (
                  <span className="flex items-center">
                    ({checkedCount}/{itemCount}&nbsp;
                    <CheckCheck size={"16"} />)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          size={"icon"}
          className="size-10 sm:size-12"
          onClick={(ev: React.MouseEvent) => {
            ev.stopPropagation();

            // Handle edit action
            if (onEdit) onEdit(shoppingList);
          }}
        >
          <LucideClipboardEdit className="size-6" />
        </Button>
      </Link>
    </Card>
  );
}
