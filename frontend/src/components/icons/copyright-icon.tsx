"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import AnimatedIcon from "@/components/icons/animated-icon";

interface ICopyrightIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

export default function CopyrightIcon({
  size,
  duration = 1,
  className,
}: ICopyrightIconProps) {
  const icon: Variants = {
    normal: { scale: 1, rotate: 0, transition: { duration: 0 } },
    animate: {
      scale: [1, 1.1, 0.95, 1.1, 0.95, 1],
      rotate: [0, 180, 360],
      transition: {
        scale: { duration: 1.5 * duration, ease: "easeInOut", repeat: 0 },
        rotate: { duration: 1.5 * duration, ease: "easeInOut", repeat: 0 },
      },
    },
  };

  const circle: Variants = {
    normal: { pathLength: 1, opacity: 1, transition: { duration: 0 } },
    animate: {
      pathLength: [1, 0, 1],
      opacity: [1, 0.5, 1],
      transition: { duration: 1.5 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  const c: Variants = {
    normal: { pathLength: 1, opacity: 1, scale: 1, transition: { duration: 0 } },
    animate: {
      pathLength: [1, 0, 1],
      opacity: [1, 0.3, 1],
      scale: [1, 0.8, 1],
      transition: { duration: 1.5 * duration, ease: "easeInOut", repeat: 0 },
    },
  };

  return (
    <AnimatedIcon size={size} className={className} svgVariants={icon}>
      <motion.circle cx="12" cy="12" r="10" variants={circle} />
      <motion.path d="M14.83 14.83a4 4 0 1 1 0-5.66" variants={c} />
    </AnimatedIcon>
  );
}
