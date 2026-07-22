"use client";

import { useEffect, useState, type RefObject } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

import { cursorTiltDeg } from "@/app/(root)/utils/cursor";

const NEUTRAL_BUFFER_PX = 32;
const MAX_TILT_DEG = 12;
const TURN_SPRING = { stiffness: 120, damping: 18 };

interface ICursorPoseValues {
  scaleX: MotionValue<number>;
  rotate: MotionValue<number>;
  engaged: boolean;
}

/**
 * Orientation of the hero cart toward the cursor as smooth motion values:
 * `scaleX` flips it toward the cursor's half of the viewport, `rotate` tilts
 * it up or down at it. Neutral (with `engaged` false) while the cursor is over
 * the hero copy column - the copy block's vertical band, narrowed horizontally
 * to its h1 - so the cart does not fidget while the visitor reads.
 */
export function useCursorPose(
  anchorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): ICursorPoseValues {
  const facing = useMotionValue(1);
  const aim = useMotionValue(0);
  const scaleX = useSpring(facing, TURN_SPRING);
  const rotate = useSpring(aim, TURN_SPRING);
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (!enabled) {
      facing.set(1);
      aim.set(0);
      setEngaged(false);
      return;
    }

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const copyBlock = anchorRef.current?.parentElement;
    const heading = copyBlock?.querySelector("h1");

    function evaluate() {
      frame = 0;
      const anchor = anchorRef.current;
      if (!anchor || !copyBlock) return;

      const band = copyBlock.getBoundingClientRect();
      const column = (heading ?? copyBlock).getBoundingClientRect();
      const overCopy =
        pointerY > band.top - NEUTRAL_BUFFER_PX &&
        pointerY < band.bottom + NEUTRAL_BUFFER_PX &&
        pointerX > column.left - NEUTRAL_BUFFER_PX &&
        pointerX < column.right + NEUTRAL_BUFFER_PX;

      if (overCopy) {
        facing.set(1);
        aim.set(0);
        setEngaged(false);
        return;
      }

      const cart = anchor.getBoundingClientRect();
      const dx = pointerX - (cart.left + cart.width / 2);
      const dy = pointerY - (cart.top + cart.height / 2);
      facing.set(pointerX < window.innerWidth / 2 ? -1 : 1);
      aim.set(cursorTiltDeg(dx, dy, MAX_TILT_DEG));
      setEngaged(true);
    }

    function handleMove(event: PointerEvent) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(evaluate);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [anchorRef, enabled, facing, aim]);

  return { scaleX, rotate, engaged };
}
