import { cn } from "@/lib/utils";
export const DOODLE_CART_HAPPY = {
  // Cropped tight vertically; the extra right-side units align the box center
  // with the basket's visual mass (the handle overhangs left), so centering
  // the canvas optically centers the mark in PNG exports.
  viewBox: "-1 6 68 50.5",
  // Light wheelie: the cart pivots back on the rear wheel's contact point;
  // the translate keeps the rotated handle tip clear of the left edge.
  tilt: "translate(2.5 0) rotate(-7 23 53.5)",
  body: "M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-36.5-.85",
  eyes: "M24.5 22.3c2.5-3.1 5.2-3.2 8-.3M38.5 22.1c2.2-2.8 4.7-2.9 7.2-.4",
  wheels: [
    { cx: 23, cy: 49 },
    { cx: 45, cy: 49 },
  ],
  wheelRadius: 4.5,
};

interface IDoodleCartHappyIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// The hand-drawn cart brand mark: happy "^^" eyes, tilted back in a wheelie.
export default function DoodleCartHappyIcon({
  size = 64,
  strokeWidth = 4,
  className,
}: IDoodleCartHappyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 50.5) / 68}
      viewBox={DOODLE_CART_HAPPY.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g transform={DOODLE_CART_HAPPY.tilt}>
        <path d={DOODLE_CART_HAPPY.body} />
        <path d={DOODLE_CART_HAPPY.eyes} />
        {DOODLE_CART_HAPPY.wheels.map((wheel) => (
          <circle
            key={wheel.cx}
            cx={wheel.cx}
            cy={wheel.cy}
            r={DOODLE_CART_HAPPY.wheelRadius}
          />
        ))}
      </g>
    </svg>
  );
}
