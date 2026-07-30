import ShoppingListDetailSkeleton from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-skeleton";

/**
 * Paints during the RSC navigation, before the client component mounts. It
 * cannot read the remembered row count (that is localStorage, and this renders
 * on the server), so it takes the default and the client refines it.
 */
export default function Loading() {
  return <ShoppingListDetailSkeleton />;
}
