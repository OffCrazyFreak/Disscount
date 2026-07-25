"use client";

import { ArrowRight, Eye, Image as ImageIcon, ListPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BottomSheet from "@/components/custom/bottom-sheet/bottom-sheet";
import { Button } from "@/components/ui/button";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import useProductModals from "@/app/products/hooks/use-product-modals";
import useProductNavigation from "@/hooks/use-product-navigation";
import { openProductImageSearch } from "@/app/products/utils/product-image-search";
import { formatQuantity } from "@/utils/strings";

interface IQuickAction {
  icon: LucideIcon;
  label: string;
  run: () => void;
}

interface IProductQuickActionsSheetProps {
  product: ProductResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal, because nothing behind it changes while it is open and two of its
 * actions open a dialog anyway. In a list the bottom nav cannot know which card
 * you meant, which is why a card keeps its own launcher.
 */
export default function ProductQuickActionsSheet({
  product,
  open,
  onOpenChange,
}: IProductQuickActionsSheetProps) {
  const { openAddToList, openWatchlist } = useProductModals();
  const navigateToProduct = useProductNavigation();

  const actions: IQuickAction[] = [
    {
      icon: ListPlus,
      label: "Dodaj na popis",
      run: () => openAddToList(product),
    },
    { icon: Eye, label: "Prati proizvod", run: () => openWatchlist(product) },
    {
      icon: ImageIcon,
      label: "Traži sliku",
      run: () => openProductImageSearch(product),
    },
    {
      icon: ArrowRight,
      label: "Otvori proizvod",
      run: () => navigateToProduct(product.ean, product),
    },
  ];

  const details = [
    product.brand,
    product.quantity && formatQuantity(product.quantity),
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name ?? "Proizvod"}
      description={details || undefined}
      srOnlyDescription={false}
    >
      {actions.map(({ icon: Icon, label, run }) => (
        <Button
          key={label}
          type="button"
          variant="ghost"
          className="h-12 w-full justify-start gap-3 text-base"
          onClick={() => {
            onOpenChange(false);
            run();
          }}
        >
          <Icon className="size-5" />
          {label}
        </Button>
      ))}
    </BottomSheet>
  );
}
