import { cn } from "@/lib/utils";

export const DOODLE_CART = {
  viewBox: "0 0 64 60",
  body: "M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-36.5-.85",
  smile: "M24.5 19.5c2.5 3.1 5.2 3.2 8 .3M38.5 19.5c1.6 2 3.3 2.4 5.2 1.2",
  wheels: [
    { cx: 23, cy: 49 },
    { cx: 45, cy: 49 },
  ],
  wheelRadius: 4.5,
};

interface IDoodleCartIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// The hand-drawn smiling shopping cart, as a static icon/logo mark. Inherits
// color via currentColor; the scroll-animated version lives in
// app/(root)/components/doodles/cart-doodle.tsx and shares these paths.
export default function DoodleCartIcon({
  size = 64,
  strokeWidth = 4,
  className,
}: IDoodleCartIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size * 60) / 64}
      viewBox={DOODLE_CART.viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d={DOODLE_CART.body} />
      <path d={DOODLE_CART.smile} />
      {DOODLE_CART.wheels.map((wheel) => (
        <circle
          key={wheel.cx}
          cx={wheel.cx}
          cy={wheel.cy}
          r={DOODLE_CART.wheelRadius}
        />
      ))}
    </svg>
  );
}
