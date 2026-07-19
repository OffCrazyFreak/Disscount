"use client";

import { Children, ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  // Vertical travel of each item as it fades in.
  distance?: number;
  // Delay between consecutive items.
  stagger?: number;
  duration?: number;
}

// Staggered fade + rise reveal for modal/section content; no-op under reduced
// motion (hydration-safe: the plain-div branch only activates after mount).
// Accepts a single child or an array (falsy children are dropped).
export function StaggerChildren({
  children,
  className,
  distance = 8,
  stagger = 0.05,
  duration = 0.25,
}: StaggerChildrenProps) {
  const reduceMotion = useReducedMotionSafe();
  const items = Children.toArray(children);

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {items.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: distance },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration, ease: "easeOut" },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
