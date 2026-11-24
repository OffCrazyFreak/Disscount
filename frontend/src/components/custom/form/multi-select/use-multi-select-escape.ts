"use client";

import { useEffect, useRef, type RefObject } from "react";

/** A dialog would take Escape from an inline list, so window capture gets it first, for the focused list only. */
export default function useMultiSelectEscape(
  active: boolean,
  contentRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  // Held in a ref so a caller re-creating the callback does not resubscribe.
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const target = event.target;
      const inside =
        target instanceof Node &&
        (contentRef.current?.contains(target) ||
          triggerRef.current?.contains(target));

      if (!inside) return;

      event.preventDefault();
      event.stopPropagation();
      onEscapeRef.current();
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [active, contentRef, triggerRef]);
}
