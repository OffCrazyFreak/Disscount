import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import SkeletonRegion from "@/components/custom/skeleton/skeleton-region";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A neutral page shape: a title, then a few blocks.
 *
 * The fallback for routes that have no skeleton of their own, and the last
 * resort in app/loading.tsx. Prefer a route's own skeleton wherever one exists,
 * since this one only avoids a collapse, it does not prevent a shift.
 */
export default function PageShellSkeleton() {
  return (
    <SkeletonRegion className="space-y-6" label="Učitavanje stranice">
      <Skeleton className="h-[1lh] w-64 max-w-full text-2xl" />

      <RepeatSkeleton className="space-y-4" count={3}>
        <Skeleton className="h-24 w-full rounded-xl" />
      </RepeatSkeleton>
    </SkeletonRegion>
  );
}
