import { cn } from "@/lib/utils";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface IHoldProgressRingProps {
  /** A CSS expression such as `var(--press-progress, 0)` tracks a value written outside React. */
  progress: number | string;
  className?: string;
}

/** A string progress carries no reduced-motion guard, because it is the only cue that a hold the user is performing is being registered. */
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
