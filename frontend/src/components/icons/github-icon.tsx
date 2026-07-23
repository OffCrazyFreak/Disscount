"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import AnimatedIcon from "@/components/icons/animated-icon";

interface IGithubIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

export default function GithubIcon({
  size,
  duration = 1,
  className,
}: IGithubIconProps) {
  const svg: Variants = {
    normal: { scale: 1, transition: { duration: 0.3 * duration } },
    animate: { scale: [1, 1.05, 1], transition: { duration: 1 * duration } },
  };

  const body: Variants = {
    normal: {
      pathLength: 1,
      pathOffset: 0,
      opacity: 1,
      transition: { duration: 0.3 * duration },
    },
    animate: {
      pathLength: [1, 0.6, 1],
      pathOffset: [0, 0.4, 0],
      opacity: [1, 0.7, 1],
      transition: { duration: 1 * duration },
    },
  };

  const handWave: Variants = {
    normal: { rotate: 0, originX: 0.9, originY: 0.5 },
    animate: {
      rotate: [0, 20, -15, 0],
      originX: 0.9,
      originY: 0.5,
      transition: { duration: 1 * duration },
    },
  };

  return (
    <AnimatedIcon size={size} className={className} svgVariants={svg}>
      <motion.path
        d="M15 22v-4a4.8 4.8 0 0 0-1-3.5
           c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5
           .28-1.15.28-2.35 0-3.5
           0 0-1 0-3 1.5
           -2.64-.5-5.36-.5-8 0
           C6 2 5 2 5 2
           c-.3 1.15-.3 2.35 0 3.5
           A5.403 5.403 0 0 0 4 9
           c0 3.5 3 5.5 6 5.5
           -.39.49-.68 1.05-.85 1.65
           -.17.6-.22 1.23-.15 1.85v4"
        variants={body}
      />
      <motion.path d="M9 18c-4.51 2-5-2-7-2" variants={handWave} />
    </AnimatedIcon>
  );
}
