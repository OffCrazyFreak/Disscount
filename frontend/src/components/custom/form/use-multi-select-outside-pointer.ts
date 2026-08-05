"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Closes an inline list when a press lands outside it.
 *
 * The popover gets this from Radix. An inline list is not a dismissable layer,
 * so without it every facet a user opens stays open, which on a phone is the
 * whole filter sheet expanded at once with no way to collapse any of it except
 * finding each trigger again.
 *
 * Deliberately on `document` in the bubble phase and deliberately without
 * `stopPropagation`, unlike the Escape hook next door. vaul dismisses its own
 * sheet from an outside press, and swallowing that event would stop the
 * products sheet closing.
 *
 * The trigger counts as inside, or its own toggle would fight this and the list
 * would reopen on the same press that closed it.
 */
export default function useMultiSelectOutsidePointer(
  active: boolean,
  contentRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  onOutside: () => void,
): void {
  const onOutsideRef = useRef(onOutside);

  useEffect(() => {
    onOutsideRef.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;

      onOutsideRef.current();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [active, contentRef, triggerRef]);
}
