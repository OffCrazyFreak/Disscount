"use client";
import { cn } from "@/lib/utils";
import { useScrolledPast } from "@/hooks/use-scrolled-past";
import { usePathname } from "@/i18n/navigation";
import HeaderBrand from "@/components/custom/header/components/header-brand";
import HeaderNav from "@/components/custom/header/components/header-nav";
import HeaderSearch from "@/components/custom/header/components/header-search";
import HeaderActions from "@/components/custom/header/components/header-actions";

export default function Header() {
  const isScrolled = useScrolledPast(50);
  // The phone map draws its own bar with the store search in it. Hidden with
  // CSS rather than unmounted, so the server render already matches.
  const isMap = usePathname() === "/map";

  return (
    <>
      <header>
        <nav
          className={cn(
            "fixed z-[var(--z-header)] inset-x-4 my-4",
            isMap && "max-md:hidden",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-6xl transition-all duration-300 px-2",
              isScrolled &&
                "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-sm px-4",
            )}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-6 flex-wrap py-2 sm:py-4">
              <HeaderBrand />

              <HeaderNav />

              <HeaderSearch />

              <HeaderActions />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
