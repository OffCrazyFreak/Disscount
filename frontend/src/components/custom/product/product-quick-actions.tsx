"use client";

import { Eye, ListPlus, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import useProductModals from "@/hooks/use-product-modals";
import { shareOrCopy } from "@/utils/browser/share";

interface IProductQuickActionsProps {
  product: ProductResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * What a long press on a product card opens. Every action here also has a
 * tappable button elsewhere, so the gesture is a shortcut rather than the only
 * way in, which is what keeps it keyboard and screen-reader accessible.
 */
export default function ProductQuickActions({
  product,
  open,
  onOpenChange,
}: IProductQuickActionsProps) {
  const { openAddToList, openWatchlist } = useProductModals(product);

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  async function share() {
    onOpenChange(false);

    const outcome = await shareOrCopy({
      title: product.name ?? product.ean,
      url: `${window.location.origin}/products/${encodeURIComponent(product.ean)}`,
    });

    if (outcome === "copied") toast.success("Veza je kopirana");
    if (outcome === "failed") toast.error("Dijeljenje nije uspjelo");
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="truncate text-base">
            {product.name ?? product.ean}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-1 p-4 pt-0">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => run(openAddToList)}
            className="h-14 justify-start gap-3 text-base"
          >
            <ListPlus className="size-5" />
            Dodaj na popis
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => run(openWatchlist)}
            className="h-14 justify-start gap-3 text-base"
          >
            <Eye className="size-5" />
            Prati cijenu
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={share}
            className="h-14 justify-start gap-3 text-base"
          >
            <Share2 className="size-5" />
            Podijeli
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
