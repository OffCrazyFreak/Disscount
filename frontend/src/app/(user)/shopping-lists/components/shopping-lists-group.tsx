"use client";

import React from "react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import ShoppingListCard from "@/app/(user)/shopping-lists/components/shopping-list-card";
import { ShoppingListDto } from "@/lib/api/types";
import { ViewMode } from "@/typings/view-mode";

type Props = {
  shoppingLists: Array<ShoppingListDto>;
  className?: string;
  onEdit?: (shoppingList: ShoppingListDto) => void;
  viewMode?: ViewMode;
};

export default function ShoppingListsGroup({
  shoppingLists,
  className,
  onEdit,
  viewMode = "list",
}: Props) {
  if (!shoppingLists || shoppingLists.length === 0) return null;

  return (
    <AnimatedGroup
      variants={{
        container: {
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        },
        item: {
          hidden: {
            opacity: 0,
            filter: "blur(12px)",
            y: 12,
          },
          visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
              type: "spring" as const,
              bounce: 0.3,
              duration: 1.5,
            },
          },
        },
      }}
      className={
        className ??
        (viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
          : "space-y-4")
      }
    >
      {shoppingLists
        .sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt, "hr", { sensitivity: "base" })
        )
        .map((shoppingList) => (
          <ShoppingListCard
            key={shoppingList.id}
            shoppingList={shoppingList}
            onEdit={onEdit}
            viewMode={viewMode}
          />
        ))}
    </AnimatedGroup>
  );
}
