"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Closes an inline list on Escape, before anything around it reacts.
 *
 * Radix's dismissable layers listen for Escape in the capture phase on
 * `document`, and only the topmost layer acts on it. A popover is such a layer,
 * so it closes and the dialog behind it does not. An inline list is not a layer,
 * so without this a dialog around it would take the key and close itself.
 *
 * The capture phase reaches `window` one step before `document`, which is the
 * only place left to stop that. The popover path needs none of this.
 *
 * Only the list holding focus acts. Without that test every open list would
 * answer the same keypress, so two open facets would both close and focus would
 * land on whichever mounted last, and an Escape meant for the sheet around them
 * would be swallowed no matter where the user was typing.
 */
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
