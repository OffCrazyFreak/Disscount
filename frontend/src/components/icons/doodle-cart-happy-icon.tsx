import { cn } from "@/lib/utils";
import { DOODLE_CART } from "@/components/icons/doodle-cart-icon";

export const DOODLE_CART_HAPPY = {
  // Wider than the classic 64x60 box: the extra units sit on the right so the
  // mark reads optically centered above the wordmark.
  viewBox: "0 0 66 60",
  // Light wheelie: the cart pivots back on the rear wheel's contact point;
  // the translate keeps the rotated handle tip clear of the left edge.
  tilt: "translate(2.75 0) rotate(-7 23 53.5)",
  body: DOODLE_CART.body,
  eyes: "M24.5 22.3c2.5-3.1 5.2-3.2 8-.3M38.5 22.1c2.2-2.8 4.7-2.9 7.2-.4",
  wheels: DOODLE_CART.wheels,
  wheelRadius: DOODLE_CART.wheelRadius,
};

interface IDoodleCartHappyIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// Variant of DoodleCartIcon with happy "^^" eyes, tilted back in a wheelie.
export default function DoodleCartHappyIcon({
  size = 64,
  strokeWidth = 4,
  className,
}: IDoodleCartHappyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 60) / 66}
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
