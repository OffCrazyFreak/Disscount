"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

import { cursorTiltDeg } from "@/app/(root)/utils/cursor";

const STOP_DISTANCE_PX = 64;
const MAX_TILT_DEG = 30;
// Ignores near-vertical approaches, so the cart never flaps left and right.
const FLIP_DEADZONE_PX = 12;
const LAZY_SPRING = { stiffness: 50, damping: 14, mass: 1.2 };
const TURN_SPRING = { stiffness: 160, damping: 18 };

interface ICursorFollowValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scaleX: MotionValue<number>;
  rotate: MotionValue<number>;
}

/**
 * Viewport-center coordinates that lazily trail the cursor with a soft spring
 * while `active`, plus the orientation (horizontal facing and up/down tilt)
 * that keeps the cart aimed at the cursor. The chase starts from the anchor's
 * current position and always stops STOP_DISTANCE_PX short of the pointer.
 */
export function useCursorFollow(
  anchorRef: RefObject<HTMLElement | null>,
  active: boolean,
): ICursorFollowValues {
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const facing = useMotionValue(1);
  const aim = useMotionValue(0);
  const x = useSpring(targetX, LAZY_SPRING);
  const y = useSpring(targetY, LAZY_SPRING);
  const scaleX = useSpring(facing, TURN_SPRING);
  const rotate = useSpring(aim, TURN_SPRING);

  useEffect(() => {
    if (!active) return;

    let cursorX = 0;
    let cursorY = 0;
    let hasCursor = false;

    const anchor = anchorRef.current?.getBoundingClientRect();
    if (anchor) {
      targetX.jump(anchor.left + anchor.width / 2);
      targetY.jump(anchor.top + anchor.height / 2);
      x.jump(targetX.get());
      y.jump(targetY.get());
    }

    function orient() {
      if (!hasCursor) return;
      const dx = cursorX - x.get();
      const dy = cursorY - y.get();
      if (Math.abs(dx) > FLIP_DEADZONE_PX) facing.set(dx < 0 ? -1 : 1);
      aim.set(cursorTiltDeg(dx, dy, MAX_TILT_DEG));
    }

    function handleMove(event: PointerEvent) {
      cursorX = event.clientX;
      cursorY = event.clientY;
      hasCursor = true;

      // Stops short along the approach, so the cart never sits under the pointer.
      const dx = cursorX - x.get();
      const dy = cursorY - y.get();
      const distance = Math.hypot(dx, dy);
      if (distance > STOP_DISTANCE_PX) {
        const reach = (distance - STOP_DISTANCE_PX) / distance;
        targetX.set(x.get() + dx * reach);
        targetY.set(y.get() + dy * reach);
      }

      orient();
    }

    const unsubscribeX = x.on("change", orient);
    const unsubscribeY = y.on("change", orient);
    window.addEventListener("pointermove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      unsubscribeX();
      unsubscribeY();
    };
  }, [active, anchorRef, targetX, targetY, facing, aim, x, y]);

  return { x, y, scaleX, rotate };
}
