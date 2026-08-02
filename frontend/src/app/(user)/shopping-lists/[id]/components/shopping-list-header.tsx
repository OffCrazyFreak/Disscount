import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import ShoppingListActionButtons from "@/app/(user)/shopping-lists/[id]/components/shopping-list-action-buttons";
import ShoppingListVisibilityIndicator from "@/app/(user)/shopping-lists/components/shopping-list-visibility-indicator";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IShoppingListHeaderProps {
  shoppingList: ShoppingList;
  /**
   * False for a logged-out link visitor: copying creates a list on their own account,
   * and the list index they would go back to is itself behind a login.
   */
  isSignedIn?: boolean;
}

export default function ShoppingListHeader({
  shoppingList,
  isSignedIn = true,
}: IShoppingListHeaderProps) {
  // The server resolves this, so it stays right for a link recipient too. Editing and
  // deleting are owner-only on the backend, so a recipient must not see those controls.
  const { isOwner } = resolveShoppingListAccess(shoppingList.myAccess);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-0 sm:gap-1">
          {isSignedIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href="/shopping-lists"
                    aria-label="Natrag na popise za kupnju"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>

              <TooltipContent className="px-2 py-1 text-xs">
                Natrag na popise za kupnju
              </TooltipContent>
            </Tooltip>
          )}

          <h1 className="min-w-0 flex-1 break-words text-pretty text-xl font-bold sm:text-2xl">
            {shoppingList.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Non-owners are sent a null linkAccess, so this reads as private for them
              rather than advertising a setting they cannot change. */}
          {isOwner && (
            <ShoppingListVisibilityIndicator
              linkAccess={shoppingList.linkAccess}
            />
          )}
          <ShoppingListActionButtons
            shoppingList={shoppingList}
            showCopyButton={isSignedIn}
            showShareButton={true}
            showEditButton={isOwner}
            showDeleteButton={isOwner}
            mobilePresentation="buttons"
          />
        </div>
      </div>
    </div>
  );
}
