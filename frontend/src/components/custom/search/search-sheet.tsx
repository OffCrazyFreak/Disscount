"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/custom/search/search-bar";
import SearchSheetRecents from "@/components/custom/search/search-sheet-recents";
import { SEARCH_MORPH_LAYOUT_ID } from "@/components/custom/search/search-morph";
import { useSearchSheet } from "@/context/search-sheet-context";
import { useCameraScanner } from "@/context/scanner-context";
import useProductNavigation from "@/hooks/use-product-navigation";
import { useSearchNavigation } from "@/hooks/use-search-navigation";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from "@/utils/browser/local-storage";

/**
 * Mobile search, opened by the bar's centre tab.
 *
 * The field is always mounted, because iOS raises the keyboard only when
 * `.focus()` runs inside the tap's own task, so the input has to exist before the
 * tap. Hiding is by `visibility`, which keeps the closed sheet out of the tab
 * order and the accessibility tree.
 */
export default function SearchSheet() {
  const { isOpen, inputRef, containerRef, close } = useSearchSheet();
  const { openScanner } = useCameraScanner();
  const { search } = useSearchNavigation("/products");
  const navigateToProduct = useProductNavigation();
  const prefersReducedMotion = useReducedMotion();
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setRecents(getRecentSearches());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, close]);

  function runSearch(query: string) {
    addRecentSearch(query);
    close();
  }

  function pickRecent(query: string) {
    search(query);
    runSearch(query);
  }

  function handleScan() {
    close();
    openScanner({ onScan: (code) => navigateToProduct(code.rawValue) });
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-background/95 fixed inset-0 z-50 flex flex-col gap-5 p-4 pt-6 backdrop-blur-sm transition-opacity duration-200 md:hidden",
        isOpen ? "opacity-100" : "invisible opacity-0",
      )}
    >
      <div className="relative flex items-center gap-2">
        {/* Decorative: the centre tab's circle flying into the field's box */}
        {isOpen && (
          <motion.span
            layoutId={SEARCH_MORPH_LAYOUT_ID}
            aria-hidden="true"
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 340, damping: 32 }
            }
            className="bg-primary/15 pointer-events-none absolute inset-y-0 right-10 left-0 -z-10 rounded-2xl"
          />
        )}

        <div className="min-w-0 flex-1">
          <SearchBar
            searchRoute="/products"
            placeholder="Traži proizvod..."
            submitButtonLocation="none"
            inputRef={inputRef}
            onSubmitted={runSearch}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={close}
          aria-label="Zatvori pretragu"
          className="shrink-0"
        >
          <X className="size-5" />
        </Button>
      </div>

      <SearchSheetRecents
        queries={recents}
        onPick={pickRecent}
        onClear={() => {
          clearRecentSearches();
          setRecents([]);
        }}
        onScan={handleScan}
      />
    </div>
  );
}
