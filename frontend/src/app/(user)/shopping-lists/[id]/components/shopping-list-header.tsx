import { ArrowLeft, Calendar, ChevronLeft, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import Link from "next/link";
import { formatDate } from "@/utils/strings";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import ShoppingListActionButtons from "@/app/(user)/shopping-lists/[id]/components/shopping-list-action-buttons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShoppingListHeaderProps {
  shoppingList: ShoppingList;
}

export default function ShoppingListHeader({
  shoppingList,
}: ShoppingListHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-0 sm:gap-1 min-w-0 flex-1">
          <Link href="/shopping-lists">
            <Button variant="ghost" className="size-10 flex-shrink-0">
              <ChevronLeft className="size-6 sm:size-7" />
            </Button>
          </Link>

          <Tooltip>
            <TooltipTrigger asChild>
              <h1 className="text- sm:text-2xl font-bold truncate min-w-0">
                {shoppingList.title}
              </h1>
            </TooltipTrigger>
            <TooltipContent>
              <p>{shoppingList.title}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div
            title={
              shoppingList.isPublic ? "Popis je javan" : "Popis je privatan"
            }
            className="mr-2"
          >
            {shoppingList.isPublic ? (
              <Globe className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <ShoppingListActionButtons shoppingList={shoppingList} />
        </div>
      </div>
    </div>
  );
}
