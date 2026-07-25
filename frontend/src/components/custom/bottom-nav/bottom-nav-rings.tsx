const RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CIRCLE_PROPS = {
  cx: 30,
  cy: 30,
  r: RADIUS,
  fill: "none",
  strokeWidth: 2,
  strokeDasharray: CIRCUMFERENCE,
  strokeLinecap: "round",
} as const;

interface IBottomNavRingsProps {
  /** The open list's ticked share, or null where there is no list to track */
  completion: number | null;
}

/**
 * Both rings share the active disc's geometry so they stay concentric with it.
 * The hold ring reads the custom property the pointer layer writes to the cell,
 * so it is always mounted and simply empty at rest.
 */
export default function BottomNavRings({ completion }: IBottomNavRingsProps) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <svg viewBox="0 0 60 60" className="size-[57.6px] -rotate-90">
        {completion !== null && (
          <circle
            {...CIRCLE_PROPS}
            className="stroke-primary/40"
            strokeDashoffset={CIRCUMFERENCE * (1 - completion)}
          />
        )}

        <circle
          {...CIRCLE_PROPS}
          className="stroke-primary"
          style={{
            strokeDashoffset: `calc(${CIRCUMFERENCE}px * (1 - var(--press-progress, 0)))`,
          }}
        />
      </svg>
    </span>
  );
}
