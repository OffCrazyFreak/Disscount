import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import ShoppingListStoreCardSkeleton from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface IShoppingListStoresSkeletonProps {
  chains?: number;
}

/**
 * The body of the stores section, without its header. Kept separate because the
 * live section sits inside a CollapsibleSection that draws the header itself,
 * while the page skeleton has to draw both.
 */
export default function ShoppingListStoresSkeleton({
  chains = 3,
}: IShoppingListStoresSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton aria-hidden="true" className="h-9 w-full max-w-xs rounded-md" />

      <RepeatSkeleton className="space-y-4" count={chains}>
        <ShoppingListStoreCardSkeleton />
      </RepeatSkeleton>
    </div>
  );
}
