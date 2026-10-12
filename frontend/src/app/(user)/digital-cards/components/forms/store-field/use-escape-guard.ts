import { useEffect } from "react";

// Radix closes the whole dialog on Escape from a capture listener on the document, so a
// popup that lives inside it would take the form down with it. A capture listener on the
// window runs first and keeps Escape for the popup.
export function useEscapeGuard(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onEscape();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [active, onEscape]);
}
