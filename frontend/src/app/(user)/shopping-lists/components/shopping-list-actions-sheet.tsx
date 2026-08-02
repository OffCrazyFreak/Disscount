"use client";

import { useQueryClient } from "@tanstack/react-query";

import QuickActionsSheet from "@/components/custom/common/quick-actions-sheet";
import { shoppingListService } from "@/lib/api";
import type { ShoppingListDto } from "@/lib/api/types";
import { closeModalUrl } from "@/lib/modal/modal-navigation";
import { useUser } from "@/context/user-context";
import { useShoppingListActions } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";
import ShoppingListQuickActionsList from "@/app/(user)/shopping-lists/components/shopping-list-quick-actions-list";
import ShoppingListSummary from "@/app/(user)/shopping-lists/components/shopping-list-summary";

interface IShoppingListActionsSheetProps {
  open: boolean;
  id: string;
  /** Raised by the card once the sheet has closed, so no dialog nests in it. */
  onRequestDelete: (shoppingList: ShoppingListDto) => void;
}

/**
 * What a long press on a shopping-list card opens. Copy and share need the whole
 * list including its items, so the sheet resolves the DTO rather than taking one,
 * seeding from the collection cache while the by-id query settles.
 */
export default function ShoppingListActionsSheet({
  open,
  id,
  onRequestDelete,
}: IShoppingListActionsSheetProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const cachedList = queryClient
    .getQueryData<ShoppingListDto[]>(["shoppingLists", "me"])
    ?.find((list) => list.id === id);
  const byIdQuery = shoppingListService.useGetShoppingListById(id);
  const shoppingList =
    byIdQuery.data ?? (byIdQuery.isLoading ? cachedList : undefined);

  return (
    <QuickActionsSheet
      open={open}
      onOpenChange={(next) => !next && closeModalUrl()}
      title={shoppingList?.title ?? "Radnje za popis"}
      description="Radnje za odabrani popis za kupnju."
      summary={
        shoppingList && <ShoppingListSummary shoppingList={shoppingList} />
      }
      hasEntity={!!shoppingList}
      isLoading={byIdQuery.isLoading}
      emptyMessage="Nismo našli taj popis. Možda je obrisan."
    >
      {shoppingList && (
        <SheetActions
          shoppingList={shoppingList}
          isOwner={!!user && shoppingList.ownerId === user.id}
          onRequestDelete={onRequestDelete}
        />
      )}
    </QuickActionsSheet>
  );
}

interface ISheetActionsProps {
  shoppingList: ShoppingListDto;
  isOwner: boolean;
  onRequestDelete: (shoppingList: ShoppingListDto) => void;
}

/**
 * Split out because useShoppingListActions needs a list, and the sheet above has
 * to render its pending and missing states before one exists.
 */
function SheetActions({
  shoppingList,
  isOwner,
  onRequestDelete,
}: ISheetActionsProps) {
  const { isSharing, isCopying, handleShare, handleCopy, handleEdit } =
    useShoppingListActions(shoppingList);

  return (
    <ShoppingListQuickActionsList
      isOwner={isOwner}
      isSharing={isSharing}
      isCopying={isCopying}
      // The OS share sheet reads better over the page than over this one.
      onShare={() => {
        closeModalUrl();
        void handleShare();
      }}
      // Left open deliberately: a successful copy routes to the new list, which
      // drops the modal param anyway, and a failed one keeps its error in view.
      onCopy={() => void handleCopy()}
      // Replaces rather than closing first, for the history reason above.
      onEdit={() => handleEdit({ replace: true })}
      onDelete={() => {
        closeModalUrl();
        onRequestDelete(shoppingList);
      }}
    />
  );
}
