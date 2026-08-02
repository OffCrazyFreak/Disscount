import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ShoppingListHeaderSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header-skeleton";
import ShoppingListInfoTableSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table-skeleton";
import ShoppingListItemsSkeleton from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items-skeleton";
import ShoppingListStoresListSkeleton from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list-skeleton";

interface IShoppingListDetailSkeletonProps {
  /** Remembered from the last visit by the client; loading.tsx takes the default. */
  itemRows?: number;
}

/**
 * The whole shopping list detail page, section for section, in the same
 * `space-y-8` rhythm as shopping-list-detail-client.
 *
 * Shared by loading.tsx and the client's pending branch, which is why it takes
 * no hooks and no context.
 */
export default function ShoppingListDetailSkeleton({
  itemRows,
}: IShoppingListDetailSkeletonProps) {
  return (
    <SkeletonRegion className="space-y-8" label="Učitavanje popisa za kupnju">
      <section>
        <ShoppingListHeaderSkeleton />
      </section>

      <section>
        <ShoppingListInfoTableSkeleton />
      </section>

      <section>
        <ShoppingListItemsSkeleton rows={itemRows} />
      </section>

      {/* Price history is stored closed by default, so a header is its whole
          footprint until someone opens it. Stores is stored open. */}
      <section>
        <SectionHeaderSkeleton title="Povijest cijena" />
      </section>

      <section>
        <ShoppingListStoresListSkeleton />
      </section>
    </SkeletonRegion>
  );
}
