import type { ReactNode } from "react";

interface ISkeletonRegionProps {
  /** What is loading, announced once. Croatian, second person. */
  label?: string;
  children: ReactNode;
  className?: string;
}

/**
 * The a11y contract for every skeleton, in one place so no individual bar has to
 * repeat it. A screen reader hears the label once instead of walking a pile of
 * empty boxes.
 *
 * The label sits in its own sr-only element rather than wrapping the bars, so
 * the element carrying `className` is still the direct layout parent. Nesting a
 * div here would break any caller whose children must stay direct grid or flex
 * items, which is exactly the shift these skeletons exist to prevent.
 */
export default function SkeletonRegion({
  label = "Učitavanje",
  children,
  className,
}: ISkeletonRegionProps) {
  return (
    <>
      <span className="sr-only" role="status">
        {label}
      </span>

      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </>
  );
}
