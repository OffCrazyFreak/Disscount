"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import AnimatedIcon from "@/components/icons/animated-icon";

interface IInstagramIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

export default function InstagramIcon({
  size,
  duration = 1,
  className,
}: IInstagramIconProps) {
  const icon: Variants = {
    normal: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.08, 0.95, 1],
      rotate: [0, -2, 2, 0],
      transition: { duration: 1.3 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  const draw: Variants = {
    normal: { pathLength: 1, opacity: 1 },
    animate: {
      pathLength: [0, 1],
      opacity: [0.7, 1],
      transition: { duration: 1.5 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  const pulse: Variants = {
    normal: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.4, 1],
      opacity: [1, 0.4, 1],
      transition: { duration: 1 * duration, repeat: 0, ease: "easeInOut" },
    },
  };

  return (
    <AnimatedIcon size={size} className={className} svgVariants={icon}>
      <motion.rect
        width="20"
        height="20"
        x="2"
        y="2"
        rx="5"
        ry="5"
        variants={draw}
      />
      <motion.path
        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
        variants={draw}
      />
      <motion.line x1="17.5" x2="17.51" y1="6.5" y2="6.5" variants={pulse} />
    </AnimatedIcon>
  );
}
