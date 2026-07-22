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
  // Wrapper + per-item element, so this stays valid inside a <ul>/<tbody>.
  as?: "div" | "ul" | "ol" | "section";
  itemAs?: "div" | "li";
}

// Staggered fade + rise reveal for modal/section content; no-op under reduced
// motion (hydration-safe: the plain-element branch only activates after mount).
// Accepts a single child or an array (falsy children are dropped).
export function StaggerChildren({
  children,
  className,
  distance = 8,
  stagger = 0.05,
  duration = 0.25,
  as = "div",
  itemAs = "div",
}: StaggerChildrenProps) {
  const reduceMotion = useReducedMotionSafe();
  const items = Children.toArray(children);

  if (reduceMotion) {
    const Fallback = as;
    return <Fallback className={className}>{children}</Fallback>;
  }

  const Container = motion[as] as typeof motion.div;
  const Item = motion[itemAs] as typeof motion.div;

  return (
    <Container
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {items.map((child, index) => (
        <Item
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
        </Item>
      ))}
    </Container>
  );
}
