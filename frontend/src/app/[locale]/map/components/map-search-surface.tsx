"use client";

import { motion, Transition } from "motion/react";

import { cn } from "@/lib/utils";

import type { IFrameBox } from "@/app/[locale]/map/hooks/use-header-slot";

const FULL_CLIP = "inset(0px 0px calc(0% - 0px) 0px round 0px)";

// Clipped rather than resized, so nothing inside scales or reflows while it grows.
function frameClip(frame: IFrameBox | null) {
  if (!frame) return FULL_CLIP;
  return `inset(${frame.top}px ${frame.right}px calc(100% - ${frame.bottom}px) ${frame.left}px round 16px)`;
}

interface IMapSearchSurfaceProps {
  isOpen: boolean;
  frame: IFrameBox | null;
  transition: Transition;
  className?: string;
}

/** Invisible while closed, so the header's own background shows. */
export default function MapSearchSurface({
  isOpen,
  frame,
  transition,
  className,
}: IMapSearchSurfaceProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute inset-0 bg-background", className)}
      initial={false}
      animate={{
        clipPath: isOpen ? FULL_CLIP : frameClip(frame),
        opacity: isOpen ? 1 : 0,
      }}
      transition={transition}
    />
  );
}
