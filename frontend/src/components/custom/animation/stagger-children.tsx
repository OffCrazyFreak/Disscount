"use client";

import { ReactNode } from "react";
import type {
  RevealContainerTag,
  RevealItemTag,
} from "@/components/custom/animation/reveal-elements";
import { useRevealItems } from "@/components/custom/animation/use-reveal-items";
import RevealFallback from "@/components/custom/animation/reveal-fallback";

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
  const { reduceMotion, items, itemTag, Container, Item } = useRevealItems(
    children,
    as,
    itemAs,
  );

  if (reduceMotion) {
    return (
      <RevealFallback
        as={as}
        itemAs={itemTag}
        className={className}
        items={items}
      />
    );
  }

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
