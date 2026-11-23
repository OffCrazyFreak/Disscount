"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useScrolledPast } from "@/hooks/viewport/use-scrolled-past";
import { useHeaderBottomVariable } from "@/hooks/viewport/use-header-bottom-variable";
import { usePathname } from "@/i18n/navigation";
import HeaderBrand from "@/components/custom/header/components/header-brand";
import HeaderNav from "@/components/custom/header/components/header-nav";
import HeaderSearch from "@/components/custom/header/components/header-search";
import HeaderActions from "@/components/custom/header/components/header-actions";
import { HEADER_SLOT_ID } from "@/components/custom/header/header-slot";

export default function Header() {
  const isScrolled = useScrolledPast(50);
  const navRef = useRef<HTMLElement>(null);
  useHeaderBottomVariable(navRef);
  // The map page never scrolls and runs under the header, so the header floats; CSS so the server render matches.
  const isMap = usePathname() === "/map";

  return (
    <>
      <header>
        <nav
          ref={navRef}
          className="fixed z-[var(--z-header)] inset-x-4 my-4 max-md:has-[[data-slot-open]]:inset-x-0"
        >
          <div
            data-header-frame
            className={cn(
              "mx-auto max-w-6xl duration-300 px-2",
              // Animating a blur over the live WebGL map stutters mid-range phones, so the map page fades colours only.
              isMap
                ? "transition-[background-color,border-color]"
                : "transition-all",
              isScrolled &&
                "bg-background/70 max-w-5xl rounded-2xl border backdrop-blur-xs px-4",
              isMap &&
                "bg-background/70 rounded-2xl border backdrop-blur-xs px-4",
              // Until the map fills the slot after hydration, an empty pill would flash.
              isMap && "max-md:has-[#header-slot:empty]:invisible",
              // The open search covers the screen, so the frame steps back.
              "has-[[data-slot-open]]:border-transparent has-[[data-slot-open]]:bg-transparent has-[[data-slot-open]]:backdrop-blur-none",
              // Lined up with the open panel's inset; the transparent border still takes 1px.
              "max-md:has-[[data-slot-open]]:px-[calc(--spacing(3)-1px)]",
            )}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-6 flex-wrap py-2 sm:py-4">
              <div className={cn("contents", isMap && "max-md:hidden")}>
                <HeaderBrand />

                <HeaderNav />

                <HeaderSearch />

                <HeaderActions />
              </div>

              <div
                id={HEADER_SLOT_ID}
                className={cn(
                  "hidden",
                  isMap && "max-md:flex max-md:min-w-0 max-md:flex-1",
                )}
              />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
