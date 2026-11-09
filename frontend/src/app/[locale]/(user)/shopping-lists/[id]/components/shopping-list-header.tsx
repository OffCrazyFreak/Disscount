import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import ShoppingListActionButtons from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-action-buttons";
import ShoppingListVisibilityIndicator from "@/app/[locale]/(user)/shopping-lists/components/shopping-list-visibility-indicator";
import { resolveShoppingListAccess } from "@/app/[locale]/(user)/shopping-lists/utils/shopping-list-access";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IShoppingListHeaderProps {
  shoppingList: ShoppingList;
  /** Required because this header is shared with a public page, so the dangerous value is never implicit. */
  isSignedIn: boolean;
}

export default function ShoppingListHeader({
  shoppingList,
  isSignedIn,
}: IShoppingListHeaderProps) {
  const t = useTranslations("shoppingListDetail");

  // Editing and deleting are owner-only on the backend, and the server resolves this for recipients too.
  const { isOwner } = resolveShoppingListAccess(shoppingList.myAccess);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-0 sm:gap-1">
          {isSignedIn && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/shopping-lists" aria-label={t("backToLists")}>
                    <ChevronLeft aria-hidden="true" />
                  </Link>
                </Button>
              </TooltipTrigger>

              <TooltipContent className="px-2 py-1 text-xs">
                {t("backToLists")}
              </TooltipContent>
            </Tooltip>
          )}

          <h1 className="min-w-0 flex-1 break-words text-pretty text-xl font-bold sm:text-2xl">
            {shoppingList.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Non-owners get a null linkAccess, which would advertise a setting they cannot change. */}
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
            showOnMobile={true}
          />
        </div>
      </div>
    </div>
  );
}
