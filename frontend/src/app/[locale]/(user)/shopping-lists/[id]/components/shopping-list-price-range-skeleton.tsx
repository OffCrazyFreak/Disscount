import { Skeleton } from "@/components/ui/skeleton";

/** Purely visual because the table carries aria-busy; motion-reduce because Tailwind's animate-pulse has no reduced-motion guard. */
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
