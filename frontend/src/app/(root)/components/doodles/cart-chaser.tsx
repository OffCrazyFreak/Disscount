"use client";

import { type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useTransform } from "motion/react";

import CartLogo, { CART_ASPECT_RATIO } from "@/components/icons/cart-logo";
import TextGlow from "@/components/custom/common/text-glow";
import { useCursorFollow } from "@/app/(root)/hooks/use-cursor-follow";

// w-14 cart; height follows the SVG's viewBox aspect (see CART_ASPECT_RATIO).
const CART_WIDTH_PX = 56;
const CART_HEIGHT_PX = Math.round(CART_WIDTH_PX / CART_ASPECT_RATIO);

interface ICartChaserProps {
  anchorRef: RefObject<HTMLElement | null>;
  active: boolean;
}

// Never server-rendered, so portaling to document.body is safe.
export default function CartChaser({ anchorRef, active }: ICartChaserProps) {
  const { x, y, scaleX, rotate } = useCursorFollow(anchorRef, active);
  const left = useTransform(x, (value) => value - CART_WIDTH_PX / 2);
  const top = useTransform(y, (value) => value - CART_HEIGHT_PX / 2);

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-30"
          style={{ x: left, y: top }}
          initial={{ opacity: 0, scale: 2.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <motion.div style={{ scaleX, rotate }} className="relative isolate">
            <div className="absolute -inset-4 rounded-full backdrop-blur-[6px] [mask-image:radial-gradient(closest-side,black_55%,transparent)]" />
            <TextGlow className="-inset-4" intensity={0.5} spread={40} />
            <CartLogo className="relative w-14 h-auto text-primary drop-shadow-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
