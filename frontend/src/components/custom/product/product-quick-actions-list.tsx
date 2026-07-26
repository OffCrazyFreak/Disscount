"use client";

import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";
import type { IOpenModalOptions } from "@/lib/modal/modal-navigation";

/** Full width and stacked, left-aligned so the labels read as a list */
const ACTION_CLASS = "w-full justify-start gap-3";

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
      <Button
        type="button"
        onClick={() => swapToModal(openAddToList)}
        className={ACTION_CLASS}
      >
        <ListPlus className="size-5" />
        Dodaj na popis
      </Button>

      <Button
        type="button"
        onClick={() => swapToModal(openWatchlist)}
        className={ACTION_CLASS}
      >
        <Eye className="size-5" />
        Prati cijenu
      </Button>

      <Button
        type="button"
        onClick={() =>
          runAndClose(() => openExternal(productImageSearchUrl(product)))
        }
        className={ACTION_CLASS}
      >
        <ImageIcon className="size-5" />
        Pretraži sliku proizvoda
      </Button>

      <Button
        type="button"
        onClick={() => runAndClose(share)}
        className={ACTION_CLASS}
      >
        <Share2 className="size-5" />
        Podijeli proizvod
      </Button>
    </>
  );
}
