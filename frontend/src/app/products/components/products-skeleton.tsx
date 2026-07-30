import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ProductCardSkeleton from "@/components/custom/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface IProductsSkeletonProps {
  rows?: number;
}

/**
 * The products index: search bar, filters bar, heading row, then result cards.
 * Shared by page.tsx's Suspense fallback and the client's pending branch.
 */
export default function ProductsSkeleton({ rows = 6 }: IProductsSkeletonProps) {
  return (
    <SkeletonRegion className="space-y-4" label="Učitavanje proizvoda">
      <SearchBarSkeleton />

      <Skeleton className="h-9 w-full max-w-sm rounded-md" />

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-[1lh] w-64 max-w-full" />
      </div>

      <RepeatSkeleton className="space-y-4" count={rows}>
        <ProductCardSkeleton />
      </RepeatSkeleton>
    </SkeletonRegion>
  );
}
