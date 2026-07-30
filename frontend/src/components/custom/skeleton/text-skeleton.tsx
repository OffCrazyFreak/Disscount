import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ITextSkeletonProps {
  lines?: number;
  /** The last line normally stops short, the way wrapped prose does. */
  lastLineWidth?: string;
  className?: string;
}

/**
 * Placeholder lines for a block of text.
 *
 * Each bar is `h-[1lh]`, one line box of whatever font the caller's wrapper
 * sets, so the placeholder is exactly as tall as the text replacing it. Do not
 * swap this for a fixed `h-4`: with `--spacing: 0.2rem` in this project that is
 * 12.8px, and it will not match any of our text sizes.
 */
export default function TextSkeleton({
  lines = 3,
  lastLineWidth = "60%",
  className,
}: ITextSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => {
        const isLast = index === lines - 1;

        return (
          <Skeleton
            key={index}
            className="h-[1lh] w-full"
            style={isLast ? { width: lastLineWidth } : undefined}
          />
        );
      })}
    </div>
  );
}
