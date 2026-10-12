"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useRef, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";

import CartLogo from "@/components/icons/cart-logo";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import InstallCard from "@/components/custom/pwa/install-card";
import LanguageSwitcher from "@/components/custom/locale/language-switcher";
import SidebarUser from "@/components/custom/sidebar/sidebar-user";
import SidebarMainNav from "@/components/custom/sidebar/sidebar-main-nav";
import SidebarProductNav from "@/components/custom/sidebar/sidebar-product-nav";
import SidebarSupportNav from "@/components/custom/sidebar/sidebar-support-nav";
import ScrollFade from "@/components/custom/common/scroll-fade";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

export default function AppSidebar() {
  const t = useTranslations("shell");
  const contentRef = useRef<HTMLDivElement>(null);
  const { setOpen, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setOpenMobile(false);
    // The sidebar context rebuilds setOpen whenever it opens, so listing it here
    // would re-run this and close the sidebar the moment it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    // h-fit hugs the content, so it needs a cap or it overflows short viewports.
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
                placeholder={t("search.productsPlaceholder")}
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

        <ScrollFade
          targetRef={contentRef}
          side="top"
          className="from-sidebar"
        />

        <ScrollFade targetRef={contentRef} className="from-sidebar" />
      </div>

      <SidebarFooter>
        <SidebarMenu className="md:hidden">
          <SidebarMenuItem>
            <LanguageSwitcher variant="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>

        <InstallCard />

        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
