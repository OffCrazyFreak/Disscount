"use client";

import { motion, Transition } from "motion/react";

import { cn } from "@/lib/utils";

import type { IFrameBox } from "@/app/[locale]/map/hooks/layout/use-header-slot";

// Open, the clip reaches past the box by the bleed, so a shadow around it stays visible.
function fullClip(bleed: number) {
  return `inset(-${bleed}px -${bleed}px calc(0% - ${bleed}px) -${bleed}px round 0px)`;
}

// Clipped rather than resized, so nothing inside scales or reflows while it grows.
function frameClip(frame: IFrameBox | null) {
  if (!frame) return fullClip(0);
  return `inset(${frame.top}px ${frame.right}px calc(100% - ${frame.bottom}px) ${frame.left}px round 16px)`;
}

interface IMapSearchSurfaceProps {
  isOpen: boolean;
  frame: IFrameBox | null;
  transition: Transition;
  className?: string;
  /** Pixels the open surface may paint outside its box, for its shadow. */
  bleed?: number;
}

/** Invisible while closed, so the header's own background shows. */
export default function MapSearchSurface({
  isOpen,
  frame,
  transition,
  className,
  bleed = 0,
}: IMapSearchSurfaceProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute inset-0 bg-background", className)}
      initial={false}
      animate={{
        clipPath: isOpen ? fullClip(bleed) : frameClip(frame),
        opacity: isOpen ? 1 : 0,
      }}
      transition={transition}
    />
  );
}
