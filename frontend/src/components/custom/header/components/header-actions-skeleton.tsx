import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IHeaderActionsSkeletonProps {
  isMobile: boolean;
}

/**
 * Stands in for whichever of the two shapes HeaderActions settles on, the sign
 * in button or the bell plus avatar, while the session initialises. Both are
 * pill-shaped and about this wide, so the header does not reflow either way.
 */
export default function HeaderActionsSkeleton({
  isMobile,
}: IHeaderActionsSkeletonProps) {
  return (
    <Skeleton
      aria-hidden="true"
      className={cn("rounded-full", isMobile ? "h-8 w-24" : "h-10 w-28")}
    />
  );
}
