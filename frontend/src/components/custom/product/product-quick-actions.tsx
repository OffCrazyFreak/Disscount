"use client";

import type { ReactNode } from "react";

import QuickActionsSheet from "@/components/custom/common/quick-actions-sheet";
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
    <QuickActionsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product?.name ?? product?.ean ?? "Radnje za proizvod"}
      description="Radnje za odabrani proizvod."
      summary={summary}
      hasEntity={!!product}
      isLoading={isLoading}
      emptyMessage="Nismo našli taj proizvod. Možda više nije u ponudi."
    >
      {product && (
        <ProductQuickActionsList
          product={product}
          onClose={() => onOpenChange(false)}
        />
      )}
    </QuickActionsSheet>
  );
}
