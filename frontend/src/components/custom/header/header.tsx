"use client";
import { cn } from "@/lib/utils";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { usePathname } from "@/i18n/navigation";
import HeaderBrand from "@/components/custom/header/components/header-brand";
import HeaderNav from "@/components/custom/header/components/header-nav";
import HeaderSearch from "@/components/custom/header/components/header-search";
import HeaderActions from "@/components/custom/header/components/header-actions";
import { HEADER_SLOT_ID } from "@/components/custom/header/header-slot";

export default function Header() {
  const isScrolled = useScrolledPast(50);
  // On phones the map puts its store search here in place of the logo, and
  // the page never scrolls, so the header floats there from the start. Done
  // with CSS rather than by unmounting, so the server render already matches.
  const isMap = usePathname() === "/map";

  return (
    <>
      <header>
        <nav className="fixed z-[var(--z-header)] inset-x-4 my-4">
          <div
            data-header-frame
            className={cn(
              "mx-auto max-w-6xl transition-all duration-300 px-2",
              isScrolled &&
                "bg-background/70 max-w-5xl rounded-2xl border backdrop-blur-xs px-4",
              isMap &&
                "max-md:bg-background/70 max-md:rounded-2xl max-md:border max-md:backdrop-blur-xs max-md:px-4",
              // Animating a blur over the live WebGL map stutters mid-range phones.
              isMap && "max-md:transition-[background-color,border-color]",
              // Until the map fills the slot after hydration, an empty pill would flash.
              isMap && "max-md:has-[#header-slot:empty]:invisible",
              // The open search covers the screen, so the frame steps back.
              "has-[[data-slot-open]]:border-transparent has-[[data-slot-open]]:bg-transparent has-[[data-slot-open]]:backdrop-blur-none",
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
