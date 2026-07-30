import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ProductCardSkeleton from "@/components/custom/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface IWatchlistSkeletonProps {
  rows?: number;
}

/** The watchlist page: search bar, heading row, then the watched product cards. */
export default function WatchlistSkeleton({
  rows = 3,
}: IWatchlistSkeletonProps) {
  return (
    <SkeletonRegion className="space-y-4" label="Učitavanje praćenih proizvoda">
      <SearchBarSkeleton submitButtonLocation="none" />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Skeleton className="h-[1lh] w-52 max-w-full" />
        <Skeleton className="h-9 w-44 shrink-0 rounded-md" />
      </div>

      <RepeatSkeleton className="space-y-3" count={rows}>
        <ProductCardSkeleton />
      </RepeatSkeleton>
    </SkeletonRegion>
  );
}
