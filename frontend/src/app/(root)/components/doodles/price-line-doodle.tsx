"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
  popVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface IPriceLineDoodleProps {
  className?: string;
}

// Wobbly falling price line: chart line draws left to right, then the
// arrowhead and a happy price flag pop in at the low end.
export default function PriceLineDoodle({ className }: IPriceLineDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 120 72" className={className}>
      <motion.path
        d="M6 14 C 16 8, 22 26, 32 24 S 48 10, 56 20 S 74 44, 84 40 S 100 50, 108 56"
        strokeWidth="3"
        variants={drawVariants()}
      />
      <motion.path
        d="M108 56 l-8-1.5 M108 56 l1-8"
        strokeWidth="3"
        variants={drawVariants(1.1)}
      />
      <motion.g variants={popVariants(1.35)}>
        <circle cx="84" cy="40" r="3" fill="currentColor" stroke="none" />
        <path d="M84 34 v-9 h22 v13 h-9" fill="none" strokeWidth="2" />
        <path d="M89 30.5 h11" strokeWidth="2" />
      </motion.g>
    </DoodleCanvas>
  );
}
