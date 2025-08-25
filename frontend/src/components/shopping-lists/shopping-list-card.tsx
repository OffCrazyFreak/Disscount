"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ListPlus, Calendar, Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { ShoppingListDto } from "@/lib/api/types";

interface ShoppingListCardProps {
  shoppingList: ShoppingListDto;
}

export default function ShoppingListCard({
  shoppingList,
}: ShoppingListCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("hr-HR");
    } catch {
      return dateString;
    }
  };

  const itemCount = shoppingList.items?.length || 0;
  const checkedCount =
    shoppingList.items?.filter((item) => item.isChecked)?.length || 0;

  return (
    <Card
      className="px-6 py-4 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/shopping-lists/${shoppingList.id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Shopping List Icon */}
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <ListPlus className="h-6 w-6 text-primary" />
          </div>

          {/* Shopping List Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                {shoppingList.title}
              </h3>
              <div
                title={shoppingList.isPublic ? "Javna lista" : "Privatna lista"}
              >
                {shoppingList.isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(shoppingList.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1">
                <span>{itemCount} stavki</span>
                {itemCount > 0 && (
                  <span className="text-gray-400">
                    ({checkedCount}/{itemCount} ✓)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0">
          {itemCount === 0 ? (
            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              Prazna
            </div>
          ) : checkedCount === itemCount ? (
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Završena
            </div>
          ) : checkedCount > 0 ? (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              U tijeku
            </div>
          ) : (
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              Nova
            </div>
          )}
        </div>
      </div>

      {/* AI Prompt indicator */}
      {shoppingList.aiPrompt && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>AI generirana lista</span>
          </div>
        </div>
      )}
    </Card>
  );
}
