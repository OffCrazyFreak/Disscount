import { ChevronDown } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface IStatisticsStoreItemSkeletonProps {
  isLast?: boolean;
}

/** Mirrors the collapsed row of the statistics StoreItem. */
export default function StatisticsStoreItemSkeleton({
  isLast = false,
}: IStatisticsStoreItemSkeletonProps) {
  return (
    <div>
      <div className="flex items-center gap-4 py-2">
        <Skeleton
          aria-hidden="true"
          className="flex-shrink-0 size-12 sm:size-16 rounded-sm"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton aria-hidden="true" className="h-[1lh] w-32" />
          <Skeleton aria-hidden="true" className="h-[1lh] w-48 max-w-full" />
        </div>

        <ChevronDown
          aria-hidden="true"
          className="size-8 text-gray-500 flex-shrink-0"
        />
      </div>

      {!isLast && <Separator />}
    </div>
  );
}
