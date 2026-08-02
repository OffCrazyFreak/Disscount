import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mirrors ProductInfo line for line.
 *
 * Each bar sits inside a wrapper carrying the same font classes as the text it
 * stands in for, and is `h-[1lh]` tall, so it is exactly one line box of that
 * text. Do not swap these for a fixed `h-4`: this project sets
 * `--spacing: 0.2rem`, so `h-4` is 12.8px and matches none of our text sizes.
 */
export default function ProductInfoSkeleton() {
  return (
    <div className="min-w-0 flex-1">
      <div className="text-xs @md:text-sm">
        <Skeleton className="h-[1lh] w-24 max-w-full" />
      </div>

      <div className="text-sm @md:text-base font-bold">
        <Skeleton className="h-[1lh] w-48 max-w-full" />
      </div>

      <div className="text-xs @md:text-sm">
        <Skeleton className="h-[1lh] w-32 max-w-full" />
      </div>
    </div>
  );
}
