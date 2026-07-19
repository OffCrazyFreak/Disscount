"use client";

import { Children, ReactNode } from "react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

type RevealPreset = "rise" | "pop" | "swing";

interface IScrollRevealProps {
  children: ReactNode;
  className?: string;
  preset?: RevealPreset;
  stagger?: number;
  amount?: number;
}

const spring = { type: "spring", stiffness: 300, damping: 18 } as const;

const presets: Record<RevealPreset, Variants> = {
  rise: {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: spring },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: spring },
  },
  swing: {
    hidden: { opacity: 0, y: 24, rotate: -3 },
    visible: { opacity: 1, y: 0, rotate: 0, transition: spring },
  },
};

// Scroll-triggered staggered reveal: copy stays server-rendered because it
// crosses this client boundary as children. No-op under reduced motion.
export function ScrollReveal({
  children,
  className,
  preset = "rise",
  stagger = 0.1,
  amount = 0.3,
}: IScrollRevealProps) {
  const reduceMotion = useReducedMotionSafe();
  const items = Children.toArray(children);

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={presets[preset]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
