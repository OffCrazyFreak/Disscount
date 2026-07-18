"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface StaggerChildrenProps {
  children: ReactNode[];
  className?: string;
}

// Staggered fade/rise reveal for modal body sections; no-op under reduced motion.
export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.25, ease: "easeOut" },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
