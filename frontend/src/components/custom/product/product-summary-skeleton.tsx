import type { ReactNode } from "react";

import ProductInfoSkeleton from "@/components/custom/product/product-info-skeleton";
import {
  PRODUCT_SUMMARY_IMAGE_CLASSES,
  PRODUCT_SUMMARY_ROW_CLASSES,
} from "@/components/custom/product/product-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IProductSummarySkeletonProps {
  withImage?: boolean;
  /**
   * Real nodes, not placeholders. A row whose product is still loading often
   * already knows its controls, so they stay live instead of greying out.
   */
  trailing?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** The loading shape of ProductSummary, sharing its wrapper classes verbatim. */
export default function ProductSummarySkeleton({
  withImage = false,
  trailing,
  actions,
  className,
}: IProductSummarySkeletonProps) {
  return (
    <div className="@container">
      <div className={cn(PRODUCT_SUMMARY_ROW_CLASSES, className)}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {withImage && (
            <Skeleton
              aria-hidden="true"
              className={PRODUCT_SUMMARY_IMAGE_CLASSES}
            />
          )}

          <ProductInfoSkeleton />
        </div>

        {(trailing || actions) && (
          <div className="flex shrink-0 items-center justify-between gap-4">
            {trailing}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
