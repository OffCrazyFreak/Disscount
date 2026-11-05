"use client";

import { useEffect, useRef, type RefObject } from "react";

/** On `document` in bubble without stopPropagation, because a modal drawer closes from the same press. */
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
