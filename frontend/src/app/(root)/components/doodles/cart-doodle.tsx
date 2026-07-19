"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
  popVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";
import { DOODLE_CART } from "@/components/icons/doodle-cart-icon";

interface ICartDoodleProps {
  className?: string;
}

// Shopping cart: handle and basket draw on, wheels pop in with a bounce.
// Static version for logo/icon use: components/icons/doodle-cart-icon.tsx.
export default function CartDoodle({ className }: ICartDoodleProps) {
  return (
    <DoodleCanvas viewBox={DOODLE_CART.viewBox} className={className}>
      <motion.path d={DOODLE_CART.body} variants={drawVariants()} />

      {DOODLE_CART.wheels.map((wheel, index) => (
        <motion.circle
          key={wheel.cx}
          cx={wheel.cx}
          cy={wheel.cy}
          r={DOODLE_CART.wheelRadius}
          variants={popVariants(0.9 + index * 0.15)}
        />
      ))}

      <motion.path d={DOODLE_CART.smile} variants={drawVariants(1.2)} />
    </DoodleCanvas>
  );
}
