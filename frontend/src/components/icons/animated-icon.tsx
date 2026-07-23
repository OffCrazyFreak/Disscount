"use client";

import { ReactNode } from "react";
import { motion, useAnimation, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import { cn } from "@/lib/utils";

interface IAnimatedIconProps {
  size?: number;
  className?: string;
  svgVariants?: Variants;
  children: ReactNode;
}

// Owns the motion controls and reduced-motion guard; each icon supplies its paths.
export default function AnimatedIcon({
  size = 28,
  className,
  svgVariants,
  children,
}: IAnimatedIconProps) {
  const controls = useAnimation();
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", className)}
      onMouseEnter={() => !reduced && controls.start("animate")}
      onMouseLeave={() => controls.start("normal")}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={controls}
        initial="normal"
        variants={svgVariants}
        aria-hidden="true"
      >
        {children}
      </motion.svg>
    </motion.div>
  );
}
