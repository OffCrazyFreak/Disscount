"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import QuickActionsSheet from "@/components/custom/common/quick-actions-sheet";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useShoppingListActions } from "@/app/[locale]/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListQuickActionsList from "@/app/[locale]/(user)/shopping-lists/components/shopping-list-quick-actions-list";
import ShoppingListSummary from "@/app/[locale]/(user)/shopping-lists/components/shopping-list-summary";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

interface IShoppingListActionsSheetProps {
  open: boolean;
  id: string;
  /** Raised by the card once the sheet has closed, so no dialog nests in it. */
  onRequestDelete: (shoppingList: ShoppingListDto) => void;
}

/** Copy and share need the whole list with items, so the sheet resolves the DTO, seeding from the collection cache meanwhile. */
export default function ShoppingListActionsSheet({
  open,
  id,
  onRequestDelete,
}: IShoppingListActionsSheetProps) {
  const t = useTranslations("shoppingLists");
  const queryClient = useQueryClient();

  const cachedList = queryClient
    .getQueryData<ShoppingListDto[]>(SHOPPING_LIST_QUERY_KEYS.me)
    ?.find((list) => list.id === id);
  const byIdQuery = shoppingListService.useGetShoppingListById(id);
  const shoppingList =
    byIdQuery.data ?? (byIdQuery.isLoading ? cachedList : undefined);

  return (
    <QuickActionsSheet
      open={open}
      onOpenChange={(next) => !next && closeModalUrl()}
      title={shoppingList?.title ?? t("actionsSheet.fallbackTitle")}
      description={t("actionsSheet.description")}
      summary={
        shoppingList && <ShoppingListSummary shoppingList={shoppingList} />
      }
      hasEntity={!!shoppingList}
      isLoading={byIdQuery.isLoading}
      emptyMessage={t("actionsSheet.notFound")}
    >
      {shoppingList && (
        <SheetActions
          shoppingList={shoppingList}
          onRequestDelete={onRequestDelete}
        />
      )}
    </QuickActionsSheet>
  );
}

interface ISheetActionsProps {
  shoppingList: ShoppingListDto;
  onRequestDelete: (shoppingList: ShoppingListDto) => void;
}

/** Split out because useShoppingListActions needs a list, and the sheet must render pending and missing states before one exists. */
function SheetActions({ shoppingList, onRequestDelete }: ISheetActionsProps) {
  const { canManageShare, isShared, handleShare, handleCopy, handleEdit } =
    useShoppingListActions(shoppingList);

  return (
    <ShoppingListQuickActionsList
      isOwner={canManageShare}
      isShared={isShared}
      // The owner's share modal replaces this one for the history reason below; others get the OS share sheet, which reads better over the page.
      onShare={() => {
        if (canManageShare) {
          void handleShare({ replace: true });
          return;
        }

        closeModalUrl();
        void handleShare();
      }}
      // Left open: a successful copy routes to the new list, dropping the modal param, and a failed one keeps its error in view.
      onCopy={() => handleCopy({ replace: true })}
      // Replaces rather than closing first, for the history reason above.
      onEdit={() => handleEdit({ replace: true })}
      onDelete={() => {
        closeModalUrl();
        onRequestDelete(shoppingList);
      }}
    />
  );
}
