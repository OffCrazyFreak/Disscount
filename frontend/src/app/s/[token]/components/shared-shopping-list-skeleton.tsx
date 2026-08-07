import { Skeleton } from "@/components/ui/skeleton";
import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ShoppingListHeaderSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-header-skeleton";
import ShoppingListInfoTableSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-info-table-skeleton";
import ShoppingListItemsSkeleton from "@/app/(user)/shopping-lists/[id]/components/items/shopping-list-items-skeleton";
import ShoppingListStoresListSkeleton from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-list-skeleton";

/**
 * The shared list page, section for section. Its own file rather than a flag on
 * ShoppingListDetailSkeleton, because this page opens with an access banner the owner's
 * page has no equivalent of, and the owned skeleton has no business knowing about
 * sharing.
 *
 * No hooks and no context, so loading.tsx and the client's pending branch share it.
 */
export default function SharedShoppingListSkeleton() {
  return (
    <SkeletonRegion className="space-y-8" label="Učitavanje popisa za kupnju">
      {/* The access banner always renders on this route, so it is part of the
          reserved height rather than something that pushes the page down later. */}
      <Skeleton className="h-16 w-full rounded-lg" />

      <section>
        <ShoppingListHeaderSkeleton />
      </section>

      <section>
        <ShoppingListInfoTableSkeleton />
      </section>

      <section>
        <ShoppingListItemsSkeleton />
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
