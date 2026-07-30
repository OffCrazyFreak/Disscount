import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingListPriceRangeSkeleton() {
  return (
    <div
      aria-label="Učitavanje izračuna cijena"
      className="inline-flex items-center gap-1.5 align-middle"
      role="status"
    >
      <Skeleton aria-hidden="true" className="h-4 w-10" />
      <Skeleton aria-hidden="true" className="h-4 w-14" />
      <Skeleton aria-hidden="true" className="h-4 w-10" />
    </div>
  );
}
