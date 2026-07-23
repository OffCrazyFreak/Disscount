"use client";

import { motion } from "motion/react";
import DoodleCanvas, {
  drawVariants,
} from "@/app/(root)/components/doodles/doodle-canvas";

interface IScaleDoodleProps {
  className?: string;
}

// Matches the "Usporedba cijena" feature icon (lucide Scale).
export default function ScaleDoodle({ className }: IScaleDoodleProps) {
  return (
    <DoodleCanvas viewBox="0 0 24 24" strokeWidth={2} className={className}>
      <motion.path d="M12 3v18" variants={drawVariants()} />
      <motion.path
        d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"
        variants={drawVariants(0.2)}
      />
      <motion.path
        d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
        variants={drawVariants(0.4)}
      />
      <motion.path
        d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
        variants={drawVariants(0.5)}
      />
      <motion.path d="M7 21h10" variants={drawVariants(0.7)} />
    </DoodleCanvas>
  );
}
