import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import StoreItemSkeleton from "@/app/products/[id]/components/store-item/store-item-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface IProductChainsListSkeletonProps {
  chains?: number;
}

/**
 * The body of ProductChainsSection, without its header. Kept separate because
 * the live section is already inside a CollapsibleSection that draws the header
 * itself, while the page skeleton has to draw both.
 */
export default function ProductChainsListSkeleton({
  chains = 4,
}: IProductChainsListSkeletonProps) {
  return (
    <div className="space-y-4">
      <Skeleton aria-hidden="true" className="h-9 w-full max-w-xs rounded-md" />

      <RepeatSkeleton className="space-y-4" count={chains}>
        <StoreItemSkeleton />
      </RepeatSkeleton>
    </div>
  );
}
