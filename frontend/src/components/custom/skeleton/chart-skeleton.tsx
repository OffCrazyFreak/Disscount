import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IChartSkeletonProps {
  /** Match the real chart's height so the card does not resize under the reader. */
  className?: string;
}

/**
 * A price chart's footprint: y-axis labels, plot area, x-axis labels. Bars, not
 * a fake plot, since inventing a shape would read as real data for a moment.
 */
export default function ChartSkeleton({ className }: IChartSkeletonProps) {
  return (
    <div className={cn("flex h-64 w-full gap-3", className)}>
      <div className="flex w-10 shrink-0 flex-col justify-between py-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} aria-hidden="true" className="h-3 w-full" />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton aria-hidden="true" className="w-full flex-1 rounded-md" />

        <div className="flex justify-between">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} aria-hidden="true" className="h-3 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
}
