"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { cn } from "@/lib/utils";

export function drawVariants(delay = 0): Variants {
  return {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 1.2, bounce: 0, delay },
        opacity: { duration: 0.15, delay },
      },
    },
  };
}

export function popVariants(delay = 0): Variants {
  return {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 400, damping: 12, delay },
    },
  };
}

interface IDoodleCanvasProps {
  viewBox: string;
  className?: string;
  strokeWidth?: number;
  children: ReactNode;
}

// Children are motion elements inheriting this svg's hidden/visible variants.
// This one-time draw ignores reduced motion; globals.css only disables the
// continuous CSS doodle animations.
export default function DoodleCanvas({
  viewBox,
  className,
  strokeWidth = 2.5,
  children,
}: IDoodleCanvasProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
    >
      {children}
    </motion.svg>
  );
}
