"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListPlus, LucideClipboardEdit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { normalizeForSearch } from "@/lib/utils";
import { ShoppingListDto } from "@/lib/api/types";

export interface ShoppingListItem {
  id: number | string;
  name: string;
  category: string;
  brand: string;
  quantity?: string;
  averagePrice?: number;
  image?: string;
}

interface ShoppingListCardProps {
  shoppingList: ShoppingListItem;
}

export default function ShoppingListCard2({
  shoppingList,
}: ShoppingListCardProps) {
  const router = useRouter();

  return (
    <Card
      className="px-6 py-4 hover:shadow-md hover:scale-101 transition-shadow transition-transform cursor-pointer"
      onClick={() => router.push(`/shoppingLists/${shoppingList.id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          {/* ShoppingList Info */}
          <div className="">
            <h3
              className="font-semibold text-lg"
              onClick={(ev: React.MouseEvent) => {
                // Prevent the card click handler from firing
                ev.stopPropagation();
              }}
            >
              {shoppingList.title}
            </h3>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center justify-center flex-col sm:flex-row gap-0 sm:gap-2">
            {/* <div className="">{shoppingList.createdAt}</div> */}
            <div className="hidden sm:block">~</div>
            <div className="font-bold text-lg">
              €{(shoppingList?.averagePrice ?? 0).toFixed(2)}
            </div>
          </div>
          <Button
            variant="default"
            className="p-2"
            onClick={(ev: React.MouseEvent) => {
              ev.stopPropagation();

              // Handle edit action
            }}
          >
            <LucideClipboardEdit className="size-6" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
