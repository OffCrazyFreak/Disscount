import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import ProductSummarySkeleton from "@/components/custom/product/product-summary-skeleton";
import { cn } from "@/lib/utils";

interface IProductCardSkeletonProps {
  withImage?: boolean;
  /** Live controls, for a row that knows its actions before it knows its product. */
  trailing?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * The loading shape of ProductCard. Same Card wrapper, minus the overlay link,
 * since there is nothing to navigate to yet.
 */
export default function ProductCardSkeleton({
  withImage = false,
  trailing,
  actions,
  className,
}: IProductCardSkeletonProps) {
  return (
    <Card className={cn("relative shadow-sm", className)}>
      <ProductSummarySkeleton
        withImage={withImage}
        trailing={trailing}
        actions={actions}
      />
    </Card>
  );
}
