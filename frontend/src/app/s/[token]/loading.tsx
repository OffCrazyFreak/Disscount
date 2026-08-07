import SharedShoppingListSkeleton from "@/app/s/[token]/components/shared-shopping-list-skeleton";

/**
 * Paints during the RSC navigation, before the client component mounts. A link visitor
 * arrives here cold by definition, so this is the first thing most of them ever see.
 */
export default function Loading() {
  return <SharedShoppingListSkeleton />;
}
