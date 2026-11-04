"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

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

/** Every action also has a tappable button on the product's page, so the gesture is a shortcut, which keeps it keyboard accessible. */
export default function ProductQuickActions({
  product,
  summary,
  isLoading = false,
  open,
  onOpenChange,
}: IProductQuickActionsProps) {
  const t = useTranslations("products");

  return (
    <QuickActionsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={product?.name ?? product?.ean ?? t("quickActions.titleFallback")}
      description={t("quickActions.description")}
      summary={summary}
      hasEntity={!!product}
      isLoading={isLoading}
      emptyMessage={t("quickActions.notFound")}
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
