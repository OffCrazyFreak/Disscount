"use client";

import { Children, ReactNode } from "react";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import {
  itemTagFor,
  type RevealContainerTag,
  type RevealItemTag,
} from "@/components/custom/animation/reveal-elements";

/** The children as items, with the plain and motion tags a reveal renders them in. */
export function useRevealItems(
  children: ReactNode,
  as: RevealContainerTag,
  itemAs?: RevealItemTag,
) {
  const reduceMotion = useReducedMotionSafe();
  const items = Children.toArray(children);
  const itemTag = itemTagFor(as, itemAs);

  return {
    reduceMotion,
    items,
    itemTag,
    Container: motion[as] as typeof motion.div,
    Item: motion[itemTag] as typeof motion.div,
  };
}
