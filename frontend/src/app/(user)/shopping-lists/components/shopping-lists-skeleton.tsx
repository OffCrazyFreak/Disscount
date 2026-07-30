import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import ShoppingListItemSkeleton from "@/app/(user)/shopping-lists/components/shopping-list-item-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface IShoppingListsSkeletonProps {
  rows?: number;
}

/** The shopping lists index: search bar, heading row, then the list cards. */
export default function ShoppingListsSkeleton({
  rows = 3,
}: IShoppingListsSkeletonProps) {
  return (
    <SkeletonRegion className="space-y-4" label="Učitavanje popisa za kupnju">
      <SearchBarSkeleton submitButtonLocation="none" />

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-[1lh] w-56 max-w-full" />
        <Skeleton className="h-9 w-36 shrink-0 rounded-md" />
      </div>

      <RepeatSkeleton className="space-y-4" count={rows}>
        <ShoppingListItemSkeleton />
      </RepeatSkeleton>
    </SkeletonRegion>
  );
}
