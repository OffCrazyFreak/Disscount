import { cn } from "@/lib/utils";
import { CELL_DISC_CLASS } from "@/components/custom/bottom-nav/bottom-nav-classes";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface IBottomNavRingProps {
  /**
   * A number for a settled value, or a CSS expression such as
   * `var(--press-progress, 0)` to track a value written outside React.
   */
  progress: number | string;
  className?: string;
}

/**
 * A ring enclosing a whole cell's icon and label, sharing the active disc's
 * geometry. Used both for long-press feedback and for list completion, which are
 * the same shape at different speeds.
 *
 * stroke-dasharray is the right tool here because a circle has a known length,
 * unlike the multi-path Lucide glyphs where one dash value draws each icon at a
 * visibly different rate.
 */
export default function BottomNavRing({
  progress,
  className,
}: IBottomNavRingProps) {
  const fraction = typeof progress === "number" ? `${progress}` : progress;

  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      className={cn(CELL_DISC_CLASS, "pointer-events-none", className)}
    >
      <circle
        cx="18"
        cy="18"
        r={RADIUS}
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        // Starts at twelve o'clock so it reads as filling up, not sweeping past.
        transform="rotate(-90 18 18)"
        strokeDasharray={CIRCUMFERENCE}
        style={{
          strokeDashoffset: `calc(${CIRCUMFERENCE}px * (1 - ${fraction}))`,
        }}
      />
    </svg>
  );
}
