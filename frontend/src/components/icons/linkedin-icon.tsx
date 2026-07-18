"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import AnimatedIcon from "@/components/icons/animated-icon";

interface ILinkedInIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

export default function LinkedInIcon({
  size,
  duration = 1,
  className,
}: ILinkedInIconProps) {
  const icon: Variants = {
    normal: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.08, 0.95, 1],
      rotate: [0, -3, 3, 0],
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

  return (
    <AnimatedIcon size={size} className={className} svgVariants={icon}>
      <motion.path
        d="M16 8a6 6 0 0 1 6 6v7h-4v-7
           a2 2 0 0 0-2-2
           2 2 0 0 0-2 2v7h-4v-7
           a6 6 0 0 1 6-6z"
        variants={draw}
      />
      <motion.rect width="4" height="12" x="2" y="9" variants={draw} />
      <motion.circle cx="4" cy="4" r="2" variants={draw} />
    </AnimatedIcon>
  );
}
