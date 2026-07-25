"use client";

import { Eye, ListPlus, PackageOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BottomSheet from "@/components/custom/bottom-sheet/bottom-sheet";
import useProductNavigation from "@/hooks/use-product-navigation";
import { productByEanQueryKey } from "@/lib/cijene-api";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { ModalTarget } from "@/lib/modal/modal-registry";

interface IProductQuickActionsProps {
  product: ProductResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A launcher, so it is modal: nothing behind it changes, and two of its three
 * actions open a dialog anyway. It stays even though the bar reaches the same
 * targets, because in a list the bar cannot know which card you meant.
 */
export default function ProductQuickActions({
  product,
  open,
  onOpenChange,
}: IProductQuickActionsProps) {
  const queryClient = useQueryClient();
  const navigateToProduct = useProductNavigation();

  // The URL-driven modals take no props, so they read the product from cache.
  function openSeeded(target: ModalTarget) {
    queryClient.setQueryData(productByEanQueryKey(product.ean), product);
    openModalUrl(target);
  }

  const actions = [
    {
      icon: PackageOpen,
      label: "Otvori proizvod",
      run: () => navigateToProduct(product.ean, product),
    },
    {
      icon: ListPlus,
      label: "Dodaj na popis za kupnju",
      run: () => openSeeded({ name: "add-to-list", ean: product.ean }),
    },
    {
      icon: Eye,
      label: "Prati cijenu",
      run: () => openSeeded({ name: "watchlist", ean: product.ean }),
    },
  ];

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product.name ?? "Proizvod"}
      description="Odaberi što želiš s ovim proizvodom."
      showCloseButton
    >
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          className="h-12 w-full justify-start gap-3"
          onClick={() => {
            onOpenChange(false);
            action.run();
          }}
        >
          <action.icon className="size-5" />
          {action.label}
        </Button>
      ))}
    </BottomSheet>
  );
}
