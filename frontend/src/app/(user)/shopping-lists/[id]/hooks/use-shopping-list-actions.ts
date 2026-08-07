import { useState } from "react";
import { toast } from "sonner";
import type { ShoppingListDto as ShoppingList } from "@/lib/api/types";
import {
  openModalUrl,
  type IOpenModalOptions,
} from "@/lib/modal/modal-navigation";
import { shareOrCopy } from "@/utils/browser/share";
import { useShoppingListMutations } from "@/app/(user)/shopping-lists/[id]/hooks/use-shopping-list-mutations";
import { formatShoppingListForSharing } from "@/app/(user)/shopping-lists/utils/shopping-list-utils";
import { shareListUrl } from "@/utils/shopping-list-links";
import { resolveShoppingListAccess } from "@/app/(user)/shopping-lists/utils/shopping-list-access";

export interface IShoppingListActionGroupProps {
  showShareButton: boolean;
  /** Marks the share control as "already shared, this edits it" rather than "share this". */
  isShared: boolean;
  showCopyButton: boolean;
  showEditButton: boolean;
  showDeleteButton: boolean;
  isDeleting: boolean;
  onShare: (options?: IOpenModalOptions) => void;
  onCopy: () => void;
  onEdit: () => void;
  onDeleteClick: () => void;
}

export function useShoppingListActions(shoppingList: ShoppingList) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { deleteShoppingListMutation, confirmDelete, handleCopy } =
    useShoppingListMutations(shoppingList.id, shoppingList);

  // Returns the promise so a caller that unmounts on completion can await the
  // request instead of tearing the mutation down mid-flight.
  async function handleConfirmDelete() {
    setIsDeleteDialogOpen(false);
    await confirmDelete();
  }

  // Takes options so a caller already inside a modal can replace its history
  // entry: closeModalUrl pops with history.back(), which is async, so closing
  // first and pushing straight after would land the push and then lose it.
  function handleEdit(options?: IOpenModalOptions) {
    openModalUrl(
      {
        name: "shopping-list",
        action: "edit",
        id: shoppingList.id,
      },
      options,
    );
  }

  const { canManageShare } = resolveShoppingListAccess(shoppingList.myAccess);

  // No pending state on purpose. Nothing here is fetched, and shareOrCopy
  // documents why a flag cleared on completion strands the button spinning.
  //
  // Takes the same options as handleEdit, and for the same reason: when the owner's
  // branch opens a modal from inside another one, that has to replace rather than push.
  async function handleShare(options?: IOpenModalOptions) {
    // The owner gets the settings panel, where the link is created and revoked. Everyone
    // else can still pass the list on: either the link they already hold, or plain text.
    if (canManageShare) {
      openModalUrl(
        {
          name: "shopping-list",
          action: "share",
          id: shoppingList.id,
        },
        options,
      );
      return;
    }

    try {
      // Every viewer can pass the list on, because the URL is simply the list's own and
      // they are already looking at it. Whether it opens for the recipient is the owner's
      // call through the share modal, not something to withhold here.
      const text = formatShoppingListForSharing(shoppingList);
      const url = shareListUrl(shoppingList.id);
      const outcome = await shareOrCopy({
        title: shoppingList.title,
        text,
        url,
      });

      if (outcome === "copied") toast.success("Poveznica je kopirana");
      if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
    } catch {
      // shareOrCopy resolves an outcome rather than throwing, but appUrl() does
      // throw on a misconfigured NEXT_PUBLIC_APP_URL. This is wired straight to
      // onClick and never awaited, so without a catch the failure is invisible.
      toast.error("Dijeljenje nije uspjelo");
    }
  }

  // linkAccess comes back null for anyone but the owner, so a recipient passing the link
  // on stays on the plain share icon, which is exactly what their button does.
  const isShared =
    !!shoppingList.linkAccess && shoppingList.linkAccess !== "NONE";

  return {
    canManageShare,
    isShared,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting: deleteShoppingListMutation.isPending,
    handleConfirmDelete,
    handleEdit,
    handleShare,
    handleCopy,
  };
}
