"use client";

import { useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import CartLogo from "@/components/icons/cart-logo";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import InstallSidebarBanner from "@/components/custom/pwa/install-sidebar-banner";
import SidebarUser from "@/components/custom/sidebar/sidebar-user";
import SidebarMainNav from "@/components/custom/sidebar/sidebar-main-nav";
import SidebarProductNav from "@/components/custom/sidebar/sidebar-product-nav";
import SidebarSupportNav from "@/components/custom/sidebar/sidebar-support-nav";
import ScrollFade from "@/components/custom/common/scroll-fade";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

export default function AppSidebar() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { setOpen, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setOpenMobile(false);
    // setOpen is rebuilt whenever the sidebar opens, so listing it here would
    // close the sidebar the moment it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    // h-fit keeps the floating panel hugging its content, so it needs an
    // explicit cap (mt-24 + 1rem gap) or it overflows short viewports
    // such as tablets in landscape.
    <Sidebar
      variant="floating"
      className="mt-24 h-fit max-h-[calc(100dvh-7rem)]"
    >
      <SidebarHeader>
        <div className="flex md:hidden items-center justify-between gap-2 mx-2 my-4">
          <Link href="/" className="flex items-center gap-2">
            <CartLogo className="size-10 sm:size-12 text-primary" />

            <span className="font-saira-stencil-semibold text-2xl sm:text-3xl text-primary">
              disscount
            </span>
          </Link>

          <SidebarTrigger className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense
              fallback={<SearchBarSkeleton submitButtonLocation="block" />}
            >
              <SearchBar
                placeholder="Pretraži proizvode..."
                searchRoute="/products"
                clearable={true}
                allowScanning={true}
                submitButtonLocation="block"
              />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* pr-4 keeps the rows clear of the scrollbar, which otherwise paints
            over the badges at the end of a row. */}
        <SidebarContent
          ref={contentRef}
          className="min-h-0 gap-0 overflow-y-auto pr-4"
        >
          <SidebarMainNav />

          <SidebarProductNav />

          <SidebarSupportNav />
        </SidebarContent>

        <ScrollFade targetRef={contentRef} className="from-sidebar" />
      </div>

      <SidebarFooter>
        <InstallSidebarBanner />

        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
