import { Card } from "@/components/ui/card";
import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ShoppingListItemSkeleton from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-item-skeleton";

interface IShoppingListItemsSkeletonProps {
  rows?: number;
}

/**
 * Mirrors ShoppingListItems, open, since that is its default state. The heading
 * carries a count, so it stays a placeholder rather than rendering "Proizvodi"
 * and then reflowing when the number arrives.
 */
export default function ShoppingListItemsSkeleton({
  rows = 4,
}: IShoppingListItemsSkeletonProps) {
  return (
    <div>
      <SectionHeaderSkeleton titleWidth="10rem" />

      <Card className="p-4">
        <RepeatSkeleton className="space-y-1" count={rows}>
          <ShoppingListItemSkeleton />
        </RepeatSkeleton>
      </Card>
    </div>
  );
}
