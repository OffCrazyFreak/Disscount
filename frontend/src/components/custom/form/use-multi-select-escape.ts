"use client";

import { useEffect, useRef } from "react";

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
 */
export default function useMultiSelectEscape(
  active: boolean,
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

      event.preventDefault();
      event.stopPropagation();
      onEscapeRef.current();
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [active]);
}
