import { Fragment, type ReactNode } from "react";

interface IRepeatSkeletonProps {
  count: number;
  /** The single placeholder row or card to repeat. */
  children: ReactNode;
  /** Goes on the wrapper, so callers keep their own spacing between rows. */
  className?: string;
}

/** Saves every list skeleton from writing out its own Array.from(...).map. */
export default function RepeatSkeleton({
  count,
  children,
  className,
}: IRepeatSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        <Fragment key={index}>{children}</Fragment>
      ))}
    </div>
  );
}
