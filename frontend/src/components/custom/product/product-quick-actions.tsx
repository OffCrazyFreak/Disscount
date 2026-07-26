"use client";

import type { ReactNode } from "react";
import SheetShell from "@/components/custom/modal/sheet-shell";
import SheetDivider from "@/components/custom/modal/sheet-divider";
import ProductQuickActionsList from "@/components/custom/product/product-quick-actions-list";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

interface IProductQuickActionsProps {
  /** Absent until a shared link's product resolves, or for good if it never does */
  product?: ProductResponse;
  /** The product as the list draws it; injected, since it is feature code */
  summary?: ReactNode;
  isLoading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * What a long press on a product card opens, and what a shared link restores.
 * Every action here also has a tappable button on the product's own page, so the
 * gesture is a shortcut rather than the only way in, which is what keeps it
 * keyboard and screen-reader accessible.
 */
export default function ProductQuickActions({
  product,
  summary,
  isLoading = false,
  open,
  onOpenChange,
}: IProductQuickActionsProps) {
  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={product?.name ?? product?.ean ?? "Radnje za proizvod"}
      // The summary names the product better than a truncated title row could.
      srOnlyTitle
      description="Radnje za odabrani proizvod."
      // Without a product there are no action buttons, so the header's button is
      // the only way out of a sheet a shared link opened.
      showCloseButton={!product}
      bodyClassName="gap-2"
    >
      {summary}

      {product ? (
        <>
          <SheetDivider className="mb-1" />

          <ProductQuickActionsList
            product={product}
            onClose={() => onOpenChange(false)}
          />
        </>
      ) : (
        !isLoading && (
          <p className="text-sm text-muted-foreground">
            Nismo našli taj proizvod. Možda više nije u ponudi.
          </p>
        )
      )}
    </SheetShell>
  );
}
