import { Skeleton } from "@/components/ui/skeleton";

/**
 * Purely visual: the table it sits in carries aria-busy, and announcing here as
 * well put two competing live regions in one table while announcing nothing,
 * since every child is hidden. motion-reduce matters because the spinner this
 * replaced had its animation cancelled under a reduced-motion preference and
 * Tailwind's animate-pulse carries no such guard.
 */
export default function ShoppingListPriceRangeSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="inline-flex items-center gap-1.5 align-middle"
    >
      <Skeleton className="h-4 w-10 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-14 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-10 motion-reduce:animate-none" />
    </div>
  );
}
