"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
  popVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";
import { DOODLE_CART_HAPPY } from "@/components/icons/doodle-cart-happy-icon";

interface ICartHappyDoodleProps {
  className?: string;
}

// Wheelie cart with happy eyes: basket draws on, wheels pop, eyes arch last.
// Static version for logo/icon use: components/icons/doodle-cart-happy-icon.tsx.
export default function CartHappyDoodle({ className }: ICartHappyDoodleProps) {
  return (
    <DoodleCanvas
      viewBox={DOODLE_CART_HAPPY.viewBox}
      strokeWidth={4}
      className={className}
    >
      <g transform={DOODLE_CART_HAPPY.tilt}>
        <motion.path d={DOODLE_CART_HAPPY.body} variants={drawVariants()} />

        {DOODLE_CART_HAPPY.wheels.map((wheel, index) => (
          <motion.circle
            key={wheel.cx}
            cx={wheel.cx}
            cy={wheel.cy}
            r={DOODLE_CART_HAPPY.wheelRadius}
            variants={popVariants(0.9 + index * 0.15)}
          />
        ))}

        <motion.path d={DOODLE_CART_HAPPY.eyes} variants={drawVariants(1.2)} />
      </g>
    </DoodleCanvas>
  );
}
