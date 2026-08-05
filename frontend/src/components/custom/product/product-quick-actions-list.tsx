"use client";

import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";

import QuickActionItem from "@/components/custom/common/quick-action-item";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
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
        icon={ListPlus}
        label="Dodaj na popis"
        onSelect={() => swapToModal(openAddToList)}
      />

      <QuickActionItem
        icon={Eye}
        label="Prati cijenu"
        onSelect={() => swapToModal(openWatchlist)}
      />

      <QuickActionItem
        icon={ImageIcon}
        label="Pretraži sliku proizvoda"
        onSelect={() =>
          runAndClose(() => openExternal(productImageSearchUrl(product)))
        }
      />

      <QuickActionItem
        icon={Share2}
        label="Podijeli proizvod"
        onSelect={() => runAndClose(share)}
      />
    </>
  );
}
