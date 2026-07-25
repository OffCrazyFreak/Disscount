interface IBottomNavIndicatorProps {
  index: number;
  visible: boolean;
}

/**
 * One element that slides, rather than one per cell: an indicator that unmounts
 * on one cell and mounts on another pops instead of fading, which is exactly
 * what the centre cell's cross-fade needs it not to do.
 *
 * The min() keeps the disc inside its cell at 320px, where a fixed 57.6px disc
 * would be wider than the cell and would touch the pill's inner edge.
 */
export default function BottomNavIndicator({
  index,
  visible,
}: IBottomNavIndicatorProps) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 rounded-full bg-primary/15 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
      style={{
        left: "var(--bottom-nav-pill-padding)",
        width: "min(var(--bottom-nav-disc-size), var(--bottom-nav-cell-width))",
        height: "var(--bottom-nav-disc-size)",
        opacity: visible ? 1 : 0,
        transform: `translate(calc(var(--bottom-nav-cell-width) * ${index} + (var(--bottom-nav-cell-width) - 100%) / 2), -50%)`,
      }}
    />
  );
}
