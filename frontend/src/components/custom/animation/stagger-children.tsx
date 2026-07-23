"use client";

import { Children, ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import {
  itemTagFor,
  type RevealContainerTag,
  type RevealItemTag,
} from "@/components/custom/animation/reveal-elements";

interface IStaggerChildrenProps {
  children: ReactNode;
  className?: string;
  // Vertical travel of each item as it fades in.
  distance?: number;
  // Delay between consecutive items.
  stagger?: number;
  duration?: number;
  as?: RevealContainerTag;
  itemAs?: RevealItemTag;
}

// The plain-element branch activates only after mount, keeping hydration safe.
export function StaggerChildren({
  children,
  className,
  distance = 8,
  stagger = 0.05,
  duration = 0.25,
  as = "div",
  itemAs,
}: IStaggerChildrenProps) {
  const reduceMotion = useReducedMotionSafe();
  const items = Children.toArray(children);
  const itemTag = itemTagFor(as, itemAs);

  if (reduceMotion) {
    const Fallback = as;
    const FallbackItem = itemTag;

    return (
      <Fallback className={className}>
        {items.map((child, index) => (
          <FallbackItem key={index}>{child}</FallbackItem>
        ))}
      </Fallback>
    );
  }

  const Container = motion[as] as typeof motion.div;
  const Item = motion[itemTag] as typeof motion.div;

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
