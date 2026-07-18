"use client";

import { Children, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

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
// motion. Accepts a single child or an array (falsy children are dropped).
export function StaggerChildren({
  children,
  className,
  distance = 8,
  stagger = 0.05,
  duration = 0.25,
}: StaggerChildrenProps) {
  const reduceMotion = useReducedMotion();
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
