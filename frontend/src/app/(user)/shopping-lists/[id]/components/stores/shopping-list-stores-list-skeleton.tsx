import SectionHeaderSkeleton from "@/components/custom/skeleton/section-header-skeleton";
import ShoppingListStoresSkeleton from "@/app/(user)/shopping-lists/[id]/components/stores/shopping-list-stores-skeleton";

interface IShoppingListStoresListSkeletonProps {
  chains?: number;
}

/**
 * Mirrors ShoppingListStoreSummary, open, since that is its stored default. The
 * title is fixed copy so it renders for real.
 */
export default function ShoppingListStoresListSkeleton({
  chains,
}: IShoppingListStoresListSkeletonProps) {
  return (
    <div>
      <SectionHeaderSkeleton title="Cijene po lancima trgovina" />
      <ShoppingListStoresSkeleton chains={chains} />
    </div>
  );
}
