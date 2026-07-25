/**
 * Fills concentric with the active disc while a cell is held. Its progress is
 * written straight to the cell as a custom property, so filling it never
 * re-renders anything; pathLength normalises the dash units to 0..1.
 */
export default function BottomNavHoldRing() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 60"
      className="pointer-events-none absolute size-[var(--bottom-nav-disc-size)] -rotate-90"
    >
      <circle
        cx="30"
        cy="30"
        r="27"
        pathLength="1"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1"
        className="stroke-primary"
        style={{
          strokeDashoffset: "calc(1 - var(--long-press-progress, 0))",
        }}
      />
    </svg>
  );
}
