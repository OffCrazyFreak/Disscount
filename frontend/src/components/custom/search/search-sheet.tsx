"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/custom/search/search-bar";
import SheetShell from "@/components/custom/modal/sheet-shell";
import { useSearchSheet } from "@/context/search-sheet-context";

/**
 * Mobile search, opened by the bottom nav's centre tab.
 *
 * Runs behind the bar with no scrim, so the nav stays visible and the sheet reads
 * as an extension of it rather than a layer over the app. Its own bottom padding
 * clears the bar, so nothing ends up hidden underneath.
 */
export default function SearchSheet() {
  const { isOpen, inputRef, close } = useSearchSheet();
  const pathname = usePathname();

  // Leaving the page closes the sheet, matching how the sidebar behaves.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <SheetShell
      open={isOpen}
      onOpenChange={(next) => !next && close()}
      title="Traži proizvode"
      srOnlyTitle
      description="Upiši naziv proizvoda ili skeniraj crtni kod."
      initialFocusRef={inputRef}
      modal={false}
      // Runs under the bar, and lets pointers through its own surface so the
      // tabs stay tappable while the sheet is open.
      passThroughSurface
      className="z-[44] pb-[calc(var(--bottom-nav-total)+0.5rem)] md:hidden"
      bodyClassName="pb-0"
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
    </SheetShell>
  );
}
