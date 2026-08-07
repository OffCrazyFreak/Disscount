"use client";

import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";

import QuickActionItem from "@/components/custom/common/quick-action-item";
import { PRODUCT_ACTION_LABELS } from "@/constants/product-action-labels";
import EyePen from "@/components/custom/icons/eye-pen";
import ListPen from "@/components/custom/icons/list-pen";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { watchlistService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { useIsOnPreselectedShoppingList } from "@/hooks/use-preselected-list-membership";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";
import type { IOpenModalOptions } from "@/lib/modal/modal-navigation";

interface IProductQuickActionsListProps {
  product: ProductResponse;
  onClose: () => void;
}

/**
 * The four actions themselves, split from the sheet so the shell can render a
 * pending or missing-product state without this needing a product to exist.
 */
export default function ProductQuickActionsList({
  product,
  onClose,
}: IProductQuickActionsListProps) {
  const { user } = useUser();
  const { openAddToList, openWatchlist } = useProductModals(product);
  const share = useProductShare(product);

  // The same two reads the product row's buttons make, so the sheet and the buttons
  // behind it never disagree about whether this product is already tracked or listed.
  // Both are guarded on a session: /products is public and holding a card opens this
  // sheet, so an unguarded read is a 401 plus retries for every signed-out visitor.
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist({ enabled: !!user });
  const isInWatchlist = currentUserWatchlist.some(
    (watchlistItem) => watchlistItem.productApiId === product.ean,
  );
  const isOnList = useIsOnPreselectedShoppingList(product.ean);

  // The two modal actions replace this sheet's history entry rather than closing
  // first: closeModalUrl pops with history.back(), which is async, so a push
  // straight after it would land first and then be thrown away by the pop.
  function swapToModal(open: (options: IOpenModalOptions) => void) {
    open({ replace: true });
  }

  function runAndClose(action: () => void) {
    onClose();
    action();
  }

  return (
    <>
      <QuickActionItem
        icon={isOnList ? ListPen : ListPlus}
        label={
          isOnList
            ? PRODUCT_ACTION_LABELS.editListEntry
            : PRODUCT_ACTION_LABELS.addToList
        }
        onSelect={() => swapToModal(openAddToList)}
      />

      <QuickActionItem
        icon={isInWatchlist ? EyePen : Eye}
        label={
          isInWatchlist
            ? PRODUCT_ACTION_LABELS.editWatch
            : PRODUCT_ACTION_LABELS.watch
        }
        onSelect={() => swapToModal(openWatchlist)}
      />

      <QuickActionItem
        icon={Share2}
        label="Podijeli proizvod"
        onSelect={() => runAndClose(share)}
      />

      <QuickActionItem
        icon={ImageIcon}
        label="Pretraži sliku proizvoda"
        onSelect={() =>
          runAndClose(() => openExternal(productImageSearchUrl(product)))
        }
      />
    </>
  );
}
