import { useEffect } from "react";

// Radix closes the dialog on Escape from a document capture listener; a window capture listener runs first and keeps Escape for the popup.
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
