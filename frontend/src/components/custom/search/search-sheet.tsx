"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/custom/search/search-bar";
import { useSearchSheet } from "@/context/search-sheet-context";

/**
 * Mobile search, opened by the bar's centre tab and sitting directly above it.
 *
 * The field is always mounted, because iOS raises the keyboard only when
 * `.focus()` runs inside the tap's own task, so the input has to exist before the
 * tap happens. Hiding is by `visibility`, which keeps the closed sheet out of both
 * the tab order and the accessibility tree.
 */
export default function SearchSheet() {
  const { isOpen, inputRef, containerRef, close } = useSearchSheet();

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-[43] bg-black/20 transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        ref={containerRef}
        className={cn(
          // Runs behind the bar, which stays on top at z-45, and pads its own
          // content clear of it so nothing ends up hidden underneath.
          "bg-background fixed inset-x-0 bottom-0 z-[44] rounded-t-2xl border-t p-4 pb-[calc(var(--bottom-nav-total)+0.75rem)] shadow-2xl transition-all duration-200 md:hidden",
          isOpen
            ? "translate-y-0 opacity-100"
            : "invisible translate-y-2 opacity-0",
        )}
      >
        <SearchBar
          searchRoute="/products"
          placeholder="Pretraži proizvode..."
          allowScanning
          submitButtonLocation="block"
          submitLabel="Pretraži"
          inputRef={inputRef}
          onSubmitted={close}
        />
      </div>
    </>
  );
}
