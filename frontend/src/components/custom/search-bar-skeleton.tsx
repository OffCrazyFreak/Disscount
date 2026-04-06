import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SearchBarSkeletonProps {
  submitButtonLocation?: "none" | "auto" | "block";
  className?: string;
}

export default function SearchBarSkeleton({
  submitButtonLocation = "auto",
  className,
}: SearchBarSkeletonProps) {
  const shouldShowButton = submitButtonLocation !== "none";
  const isBlockButton = submitButtonLocation === "block";

  return (
    <div className={className}>
      <div className="relative flex items-center gap-4 flex-wrap">
        <div className="relative flex-1">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>

        {shouldShowButton && (
          <Skeleton
            className={cn(
              "h-12 min-w-28 rounded-md",
              isBlockButton && "w-full",
            )}
          />
        )}
      </div>
    </div>
  );
}
