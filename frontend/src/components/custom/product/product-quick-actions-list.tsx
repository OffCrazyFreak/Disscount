"use client";

import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";

import QuickActionItem from "@/components/custom/common/quick-action-item";
import EyePen from "@/components/custom/icons/eye-pen";
import ListPen from "@/components/custom/icons/list-pen";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { watchlistService } from "@/lib/api";
import { useIsOnPreselectedShoppingList } from "@/lib/api/shopping-lists/use-preselected-list-membership";
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
  const { openAddToList, openWatchlist } = useProductModals(product);
  const share = useProductShare(product);

  // The same two reads the product row's buttons make, so the sheet and the buttons
  // behind it never disagree about whether this product is already tracked or listed.
  const { data: currentUserWatchlist = [] } =
    watchlistService.useGetCurrentUserWatchlist();
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
        label={isOnList ? "Uredi unos na popisu" : "Dodaj na popis"}
        onSelect={() => swapToModal(openAddToList)}
      />

      <QuickActionItem
        icon={isInWatchlist ? EyePen : Eye}
        label={isInWatchlist ? "Uredi praćenje cijene" : "Prati cijenu"}
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
