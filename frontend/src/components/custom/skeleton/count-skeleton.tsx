import { cn } from "@/lib/utils";

interface ICountSkeletonProps {
  className?: string;
}

/**
 * Stands in for a "(N)" inside a heading, so a count never paints as 0 first.
 *
 * Sized in em against the heading's own font and one line box tall, so the real
 * number swaps in without nudging the words either side of it.
 *
 * A span, not the shared Skeleton component, because that renders a div and a
 * heading only permits phrasing content. It carries the same `data-slot`, so the
 * reduced-motion rule in globals.css still switches its animation off.
 *
 * Hidden from assistive tech on purpose: the heading reads correctly without a
 * number, whereas announcing a placeholder count would announce something false.
 */
export default function CountSkeleton({ className }: ICountSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "bg-accent inline-block h-[1em] w-[2.5em] translate-y-[0.15em] animate-pulse rounded-sm align-baseline",
        className,
      )}
    />
  );
}
