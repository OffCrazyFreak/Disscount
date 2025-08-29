"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  ListPlus,
  Calendar,
  Globe,
  Lock,
  CheckCheck,
  LucideClipboardEdit,
  ListChecks,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ShoppingListDto } from "@/lib/api/types";
import { ViewMode } from "@/typings/view-mode";
import { Button } from "@/components/ui/button-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";

interface ShoppingListCardProps {
  shoppingList: ShoppingListDto;
  onEdit?: (shoppingList: ShoppingListDto) => void;
  viewMode?: ViewMode;
}

export default function ShoppingListCard({
  shoppingList,
  onEdit,
  viewMode = "list",
}: ShoppingListCardProps) {
  const router = useRouter();

  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  const baseClasses =
    "hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer";

  const variants: Record<string, string> = {
    list: "px-6 py-4",
    grid: "p-4",
  };

  return (
    <Card
      className={`${variants[viewMode]} ${baseClasses}`}
      onClick={() => router.push(`/shopping-lists/${shoppingList.id}`)}
    >
      <div
        className={`flex items-center justify-between gap-4 ${
          viewMode === "grid" ? "flex-col items-start" : ""
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Shopping List Icon */}
          {viewMode === "list" && (
            <div className="hidden sm:flex size-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <ListChecks className="size-8 text-primary" />
            </div>
          )}

          {/* Shopping List Info */}
          <div className="flex items-left justify-between flex-col">
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

            <div className="flex items-left flex-wrap gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>{formatDate(shoppingList.createdAt)}</span>
              </div>

              <div className="text-gray-400">
                {itemCount > 0 ? (
                  <span className="flex items-center">
                    ({checkedCount}/{itemCount}&nbsp;
                    <CheckCheck size={"16"} />)
                  </span>
                ) : (
                  <span>(empty)</span>
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
      </div>
    </Card>
  );
}
