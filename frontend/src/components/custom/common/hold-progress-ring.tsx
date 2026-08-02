import { cn } from "@/lib/utils";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface IHoldProgressRingProps {
  /**
   * A number for a settled value, or a CSS expression such as
   * `var(--press-progress, 0)` to track a value written outside React.
   */
  progress: number | string;
  className?: string;
}

/**
 * A progress ring drawn from a single circle. Positioning and colour belong to
 * the caller, since a nav cell and a card want very different geometry; the
 * viewBox scales, so no size prop is needed.
 *
 * stroke-dasharray is the right tool here because a circle has a known length,
 * unlike the multi-path Lucide glyphs where one dash value draws each icon at a
 * visibly different rate.
 *
 * At a progress of 0 the offset equals the full circumference, so nothing is
 * painted and the ring can stay mounted rather than being conditionally rendered.
 *
 * A string progress is driven straight from a CSS custom property, which the
 * long-press timer rewrites every frame. That path deliberately carries no
 * reduced-motion guard: it is progress feedback for a gesture the user is
 * actively performing, and hiding it would remove the only cue that a hold is
 * being registered.
 */
export default function HoldProgressRing({
  progress,
  className,
}: IHoldProgressRingProps) {
  const fraction = typeof progress === "number" ? `${progress}` : progress;

  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
    >
      <circle
        cx="18"
        cy="18"
        r={RADIUS}
        className={cn(
          typeof progress === "number" &&
            "transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none",
        )}
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
