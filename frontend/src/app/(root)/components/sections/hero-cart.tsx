"use client";

import { useRef } from "react";
import { motion } from "motion/react";

import CartLogo from "@/components/icons/cart-logo";
import CartChaser from "@/app/(root)/components/doodles/cart-chaser";
import { useCursorPose } from "@/app/(root)/hooks/use-cursor-pose";
import { useFinePointer } from "@/hooks/use-fine-pointer";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { useScrolledPast } from "@/hooks/use-scrolled-past";

const CHASE_AFTER_SCROLL_PX = 10;
const IDLE_SPIN_EVERY_S = 10;
const IDLE_SPIN = {
  duration: 1.2,
  ease: "easeInOut",
  delay: IDLE_SPIN_EVERY_S,
  repeat: Infinity,
  repeatDelay: IDLE_SPIN_EVERY_S,
} as const;

// Client island around the hero cart: on cursor devices it flips and tilts
// toward the cursor and hands off to CartChaser once the page scrolls. The
// SVG itself still server-renders inside this island.
export default function HeroCart() {
  const anchorRef = useRef<HTMLDivElement>(null);

  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotionSafe();
  const interactive = finePointer && !reducedMotion;

  const chasing = useScrolledPast(CHASE_AFTER_SCROLL_PX) && interactive;
  const { scaleX, rotate, engaged } = useCursorPose(
    anchorRef,
    interactive && !chasing,
  );

  // Periodic "not completely static" tease, like the search button's shine.
  const idleSpinning = !reducedMotion && !chasing && !engaged;

  return (
    <>
      <motion.div
        ref={anchorRef}
        className="mx-auto w-40 sm:w-52"
        style={{ transformPerspective: 800 }}
        animate={
          chasing
            ? { opacity: 0, scale: 0.5, rotateY: 0 }
            : { opacity: 1, scale: 1, rotateY: idleSpinning ? [0, 360] : 0 }
        }
        transition={{
          default: { type: "spring", stiffness: 220, damping: 18 },
          rotateY: idleSpinning
            ? IDLE_SPIN
            : { type: "spring", stiffness: 220, damping: 18 },
        }}
      >
        <motion.div style={{ scaleX, rotate }}>
          <CartLogo className="w-full h-auto text-primary" />
        </motion.div>
      </motion.div>

      {interactive && <CartChaser anchorRef={anchorRef} active={chasing} />}
    </>
  );
}
