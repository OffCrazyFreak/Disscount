"use client";

import cijeneService from "@/lib/cijene-api";
import { getMostFrequentCategory } from "@/app/products/utils/product-utils";
import ProductUnitPriceDetails from "@/app/products/components/product-item/product-price";
import ProductQuickActions from "@/components/custom/product/product-quick-actions";
import ProductSummary from "@/components/custom/product/product-summary";
import ProductSummarySkeleton from "@/components/custom/product/product-summary-skeleton";
import { closeModalUrl } from "@/lib/modal/modal-navigation";

interface IProductActionsSheetProps {
  open: boolean;
  ean: string;
}

/**
 * Resolves the product a shared link names and lends the sheet the price
 * display, which belongs to this feature rather than to the shared sheet. The
 * opener seeds the by-ean cache, so only a cold link actually fetches.
 */
export default function ProductActionsSheet({
  open,
  ean,
}: IProductActionsSheetProps) {
  const { data: product, isLoading } = cijeneService.useGetProductByEan({
    ean,
  });

  return (
    <ProductQuickActions
      product={product}
      isLoading={isLoading}
      summary={
        isLoading ? (
          <ProductSummarySkeleton className="px-0 @md:px-0" />
        ) : (
          <ProductSummary
            name={product?.name ?? null}
            brand={product?.brand}
            category={product ? getMostFrequentCategory(product) : null}
            trailing={
              product ? (
                <ProductUnitPriceDetails product={product} />
              ) : undefined
            }
            className="px-0 @md:px-0"
          />
        )
      }
      open={open}
      onOpenChange={(next) => !next && closeModalUrl()}
    />
  );
}
