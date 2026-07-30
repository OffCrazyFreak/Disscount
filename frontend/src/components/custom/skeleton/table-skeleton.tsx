import RepeatSkeleton from "@/components/custom/skeleton/repeat-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface ITableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * A generic rows-and-columns placeholder, for the admin tables where the column
 * set is uniform enough that a bespoke mirror would say nothing extra.
 */
export default function TableSkeleton({
  rows = 6,
  columns = 4,
}: ITableSkeletonProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-[1lh] flex-1 text-sm" />
        ))}
      </div>

      <RepeatSkeleton className="space-y-2" count={rows}>
        <div className="flex gap-4">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-9 flex-1 rounded-md" />
          ))}
        </div>
      </RepeatSkeleton>
    </div>
  );
}
