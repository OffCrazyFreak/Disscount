"use client";

import React from "react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import ShoppingListCard from "@/components/custom/shopping-lists/shopping-list-card";
import { ShoppingListDto } from "@/lib/api/types";

type Props = {
  shoppingLists: Array<ShoppingListDto>;
  className?: string;
  onEdit?: (shoppingList: ShoppingListDto) => void;
};

export default function ShoppingListsGroup({
  shoppingLists,
  className,
  onEdit,
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
      className={className ?? "space-y-4"}
    >
      {shoppingLists
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((shoppingList) => (
          <ShoppingListCard
            key={shoppingList.id}
            shoppingList={shoppingList}
            onEdit={onEdit}
          />
        ))}
    </AnimatedGroup>
  );
}
