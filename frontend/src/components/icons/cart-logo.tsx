import { cn } from "@/lib/utils";

interface ICartLogoProps {
  className?: string;
}

// Single-sourced, so the OG image and cursor-chaser share this geometry.
export const CART_VIEW_BOX = "-1 6 68 50.5";
export const CART_ASPECT_RATIO = 68 / 50.5;

// Inlined so it server-renders and every instance replays its draw-on animation.
export default function CartLogo({ className }: ICartLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={CART_VIEW_BOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <g transform="translate(2.5 0) rotate(-7 23 53.5)">
        <path
          className="dis-cart-body"
          d="M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-36.5-.85"
        />
        <path
          className="dis-cart-eyes"
          d="M24.5 22.3c2.5-3.1 5.2-3.2 8-.3M38.5 22.1c2.2-2.8 4.7-2.9 7.2-.4"
        />
        <circle className="dis-cart-wheel" cx="23" cy="49" r="4.5" />
        <circle
          className="dis-cart-wheel dis-cart-wheel-front"
          cx="45"
          cy="49"
          r="4.5"
        />
      </g>
    </svg>
  );
}
