"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import AnimatedIcon from "@/components/icons/animated-icon";

interface IBellRingIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

export default function BellRingIcon({
  size,
  duration = 1,
  className,
}: IBellRingIconProps) {
  const bell: Variants = {
    normal: { rotate: 0 },
    animate: {
      rotate: [0, -15, 13, -9, 6, -3, 0],
      transition: { duration: 1.4 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  const clapper: Variants = {
    normal: { x: 0 },
    animate: {
      x: [0, -3, 3, -2, 2, 0],
      transition: { duration: 1.4 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  const wave: Variants = {
    normal: { opacity: 1 },
    animate: {
      opacity: [1, 0.4, 1],
      transition: { duration: 1.4 * duration, repeat: 0, ease: "easeInOut" },
    },
  };

  return (
    <AnimatedIcon size={size} className={className} svgVariants={bell}>
      <motion.path d="M10.268 21a2 2 0 0 0 3.464 0" variants={clapper} />
      <motion.path d="M22 8c0-2.3-.8-4.3-2-6" variants={wave} />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      <motion.path d="M4 2C2.8 3.7 2 5.7 2 8" variants={wave} />
    </AnimatedIcon>
  );
}
