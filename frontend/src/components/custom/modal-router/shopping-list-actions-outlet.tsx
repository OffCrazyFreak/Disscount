"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { ConfirmDialog } from "@/components/custom/modal/confirm-dialog";
import useLingeringTarget, {
  SHEET_EXIT_MS,
} from "@/components/custom/modal-router/use-lingering-target";
import type { ShoppingListDto } from "@/lib/api/types";
import type { ModalTarget } from "@/lib/modal/modal-registry";
import { useShoppingListActions } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-actions";

const ShoppingListActionsSheet = dynamic(
  () =>
    import("@/app/(user)/shopping-lists/components/shopping-list-actions-sheet"),
  { ssr: false },
);

interface IShoppingListActionsOutletProps {
  target: ModalTarget | null;
}

/**
 * Mounted inside the router's signed-in branch, unlike the product one: a list is
 * owned, so there is nothing here for a signed-out visitor to do.
 *
 * The confirm dialog lives here rather than in the sheet because a Radix dialog
 * nested inside the vaul drawer is dismissed by its own overlay press. The outlet
 * stays mounted even when it renders nothing, so the pending list survives the
 * sheet closing and the two never overlap.
 */
export default function ShoppingListActionsOutlet({
  target,
}: IShoppingListActionsOutletProps) {
  const [pendingDelete, setPendingDelete] = useState<ShoppingListDto | null>(
    null,
  );

  const active = target?.name === "shopping-list-actions" ? target : null;
  const rendered = useLingeringTarget(active, SHEET_EXIT_MS);

  return (
    <>
      {rendered && (
        <ShoppingListActionsSheet
          open={!!active}
          id={rendered.id}
          onRequestDelete={setPendingDelete}
        />
      )}

      {pendingDelete && (
        <DeleteConfirm
          shoppingList={pendingDelete}
          onDone={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}

interface IDeleteConfirmProps {
  shoppingList: ShoppingListDto;
  onDone: () => void;
}

/** Split out so the delete mutation is only instantiated once a list is pending. */
function DeleteConfirm({ shoppingList, onDone }: IDeleteConfirmProps) {
  const { isDeleting, handleConfirmDelete } =
    useShoppingListActions(shoppingList);

  return (
    <ConfirmDialog
      isOpen
      onOpenChange={(open) => !open && onDone()}
      title="Obriši popis za kupnju"
      description={`Sigurno želiš obrisati popis "${shoppingList.title}"? Ova akcija se ne može poništiti.`}
      confirmLabel="Obriši"
      variant="destructive"
      // Stays mounted until the request settles, so the rollback and the toasts
      // still have a live observer to run on.
      onConfirm={async () => {
        await handleConfirmDelete();
        onDone();
      }}
      isLoading={isDeleting}
    />
  );
}
