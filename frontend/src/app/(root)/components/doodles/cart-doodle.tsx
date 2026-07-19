"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
  popVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface ICartDoodleProps {
  className?: string;
}

// Shopping cart: handle and basket draw on, wheels pop in with a bounce.
export default function CartDoodle({ className }: ICartDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 64 60" className={className}>
      <motion.path
        d="M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-38.5-.9"
        variants={drawVariants()}
      />
      <motion.circle cx="23" cy="49" r="4.5" variants={popVariants(0.9)} />
      <motion.circle cx="45" cy="49" r="4.5" variants={popVariants(1.05)} />
      <motion.path
        d="M28 19.5c2.5 3.1 5.2 3.2 8 .3M40 19.5c1.6 2 3.3 2.4 5.2 1.2"
        variants={drawVariants(1.2)}
      />
    </DoodleCanvas>
  );
}
