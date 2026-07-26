"use client";

import type { ReactNode } from "react";
import { Eye, Image as ImageIcon, ListPlus, Share2 } from "lucide-react";
import SheetShell from "@/components/custom/modal/sheet-shell";
import SheetDivider from "@/components/custom/modal/sheet-divider";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import useProductModals from "@/hooks/use-product-modals";
import useProductShare from "@/hooks/use-product-share";
import { productImageSearchUrl } from "@/utils/product-links";
import { openExternal } from "@/utils/browser/open-external";

/** Full width and stacked, left-aligned so the labels read as a list */
const ACTION_CLASS = "w-full justify-start gap-3";

interface IProductQuickActionsProps {
  product: ProductResponse;
  /** The product as the list draws it; injected, since it is feature code */
  summary?: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * What a long press on a product card opens. Every action here also has a
 * tappable button on the product's own page, so the gesture is a shortcut rather
 * than the only way in, which is what keeps it keyboard and screen-reader
 * accessible.
 */
export default function ProductQuickActions({
  product,
  summary,
  open,
  onOpenChange,
}: IProductQuickActionsProps) {
  const { openAddToList, openWatchlist } = useProductModals(product);
  const share = useProductShare(product);

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={product.name ?? product.ean}
      // The summary names the product better than a truncated title row could.
      srOnlyTitle
      description="Radnje za odabrani proizvod."
      bodyClassName="gap-2"
    >
      {summary && (
        <>
          {summary}

          <SheetDivider className="mb-1" />
        </>
      )}

      <Button
        type="button"
        onClick={() => run(openAddToList)}
        className={ACTION_CLASS}
      >
        <ListPlus className="size-5" />
        Dodaj na popis
      </Button>

      <Button
        type="button"
        onClick={() => run(openWatchlist)}
        className={ACTION_CLASS}
      >
        <Eye className="size-5" />
        Prati cijenu
      </Button>

      <Button
        type="button"
        onClick={() => run(() => openExternal(productImageSearchUrl(product)))}
        className={ACTION_CLASS}
      >
        <ImageIcon className="size-5" />
        Pretraži sliku proizvoda
      </Button>

      <Button type="button" onClick={() => run(share)} className={ACTION_CLASS}>
        <Share2 className="size-5" />
        Podijeli proizvod
      </Button>
    </SheetShell>
  );
}
