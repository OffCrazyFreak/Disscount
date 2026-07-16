"use client";

import { memo, useMemo, useRef, useState, Suspense, useEffect } from "react";
import { ChevronDown, LayoutDashboard } from "lucide-react";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import InstallSidebarBanner from "@/components/custom/pwa/install-sidebar-banner";
import SidebarUser from "@/components/custom/sidebar-user";
import ScrollFade from "@/components/custom/scroll-fade";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import cijeneService from "@/lib/cijene-api";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { storeNamesMap } from "@/constants/name-mappings";
import SearchBar from "@/components/custom/search-bar";
import SearchBarSkeleton from "@/components/custom/search-bar-skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  productNavItems,
  userNavItems,
  type NavigationItem,
} from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/notifications-context";
import { useUser } from "@/context/user-context";
import { canAccessDashboard, isAdmin } from "@/lib/api/schemas/auth-user";
import { parseListParam } from "@/utils/generic";

type OpenSection = "categories" | "stores" | "locations" | null;

export const AppSidebar = memo(function AppSidebar() {
  const [categories, setCategories] = useState<string[]>(["First", "Second"]);
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setOpen, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notifications, hasNotifications } = useNotifications();
  const { user } = useUser();

  const showDashboard = canAccessDashboard(user?.accountType);
  const userIsAdmin = isAdmin(user?.accountType);

  const isDashboardActive = pathname.startsWith("/dashboard");

  const searchParamsString = searchParams.toString();
  const fullPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`;
  const selectedCategory = searchParams.get("category");
  const isDiscountedFilterActive = searchParams.get("discounted") === "true";

  const isOnProducts = pathname.startsWith("/products");
  const selectedChainFilters = isOnProducts
    ? parseListParam(searchParams.get("chain"))
    : [];
  const selectedLocationFilters = isOnProducts
    ? parseListParam(searchParams.get("location"))
    : [];

  const { data: chainStats, isLoading: chainStatsLoading } =
    cijeneService.useGetChainStats();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
    setOpenMobile(false);
  }, [pathname]);

  // Deep-link into /products with the given filter applied; when already
  // there, keep the current search + other filters and replace only this key.
  function buildProductsFilterHref(
    key: "chain" | "location",
    value: string,
  ): string {
    const params = pathname.startsWith("/products")
      ? new URLSearchParams(searchParamsString)
      : new URLSearchParams();

    params.set(key, value);
    return `/products?${params.toString()}`;
  }

  const sortedChainStats = useMemo(() => {
    const list = chainStats?.chain_stats ?? [];
    return [...list].sort((a, b) =>
      a.chain_code.localeCompare(b.chain_code, "hr", { sensitivity: "base" }),
    );
  }, [chainStats]);

  const sortedLocations = useMemo(() => {
    const list = locations ?? [];
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, "hr", { sensitivity: "base" }),
    );
  }, [locations]);

  // Renders a single product-nav entry: a collapsible group, a disabled
  // coming-soon item (clickable for admins), or a plain link.
  function renderProductNavItem(item: NavigationItem) {
    const Icon = item.icon;
    const isActive =
      item.id === "discounted"
        ? pathname.startsWith("/products") && isDiscountedFilterActive
        : item.href !== "#" && fullPath.startsWith(item.href);

    if (item.isCollapsible) {
      const isStoresOpen = item.id === "stores" && openMenu === "stores";
      const isLocationsOpen =
        item.id === "locations" && openMenu === "locations";
      const isCategoriesOpen =
        item.id === "categories" && openMenu === "categories";
      const isOpen = isStoresOpen || isLocationsOpen || isCategoriesOpen;

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={(open) =>
            setOpenMenu(open ? (item.id as OpenSection) : null)
          }
          className="group/collapsible"
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton asChild>
              <button type="button" className="cursor-pointer group">
                <Icon />
                <span>{item.label}</span>
                <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                <span className="sr-only">Toggle</span>
              </button>
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {item.id === "categories" && (
              <SidebarMenuSub>
                {categories.map((category) => (
                  <SidebarMenuSubItem key={category}>
                    <Link
                      className={cn(
                        "flex justify-between items-center",
                        selectedCategory === category &&
                          "text-primary font-bold",
                      )}
                      href={`/products?category=${encodeURIComponent(category)}`}
                    >
                      <span>{category}</span>
                    </Link>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}

            {item.id === "stores" && (
              <SidebarMenuSub className="max-h-80 overflow-y-auto">
                {sortedChainStats.map((chain) => (
                  <SidebarMenuSubItem
                    className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                    key={chain.chain_code}
                  >
                    <Link
                      className={cn(
                        "flex justify-between items-center",
                        selectedChainFilters.includes(chain.chain_code) &&
                          "text-primary font-bold",
                      )}
                      href={buildProductsFilterHref("chain", chain.chain_code)}
                    >
                      <span>
                        {storeNamesMap[chain.chain_code] || chain.chain_code}
                      </span>
                      <span>{`(${chain.store_count})`}</span>
                    </Link>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}

            {item.id === "locations" && (
              <SidebarMenuSub className="max-h-80 overflow-y-auto">
                {sortedLocations.map((location) => (
                  <SidebarMenuSubItem
                    className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                    key={location.name}
                  >
                    <Link
                      className={cn(
                        "flex justify-between items-center",
                        selectedLocationFilters.includes(location.name) &&
                          "text-primary font-bold",
                      )}
                      href={buildProductsFilterHref("location", location.name)}
                    >
                      <span>{location.name}</span>
                      <span>{`(${location.storeCount})`}</span>
                    </Link>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (item.comingSoon && !userIsAdmin) {
      return (
        <SidebarMenuButton type="button" disabled>
          <Icon />
          <span>{item.label}</span>

          <Badge className="ml-auto text-[10px]">USKORO</Badge>
        </SidebarMenuButton>
      );
    }

    return (
      <SidebarMenuButton asChild>
        <Link
          href={item.href}
          className={cn(
            "cursor-pointer flex items-center gap-2",
            isActive && "font-bold text-primary",
          )}
        >
          <Icon className={isActive ? "text-primary" : ""} />
          <span>{item.label}</span>

          {item.comingSoon && (
            <Badge className="ml-auto text-[10px]">USKORO</Badge>
          )}
        </Link>
      </SidebarMenuButton>
    );
  }

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
            <Image
              src="/disscount-logo.png"
              alt="Disscount logo"
              width={128}
              height={128}
              className="size-8 sm:size-10"
            />

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
        <SidebarContent ref={contentRef} className="min-h-0 overflow-y-auto">
        {/* Dashboard sits in the desktop header, so it's only surfaced here on
            mobile, pinned above all other items and split off by a separator. */}
        {showDashboard && (
          <div className="md:hidden">
            <SidebarMenu>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn(isDashboardActive && "hover:text-primary")}
                    >
                      <Link
                        href="/dashboard"
                        className={cn(
                          "flex items-center gap-2",
                          isDashboardActive && "font-bold text-primary",
                        )}
                      >
                        <LayoutDashboard
                          className={isDashboardActive ? "text-primary" : ""}
                        />
                        <span>Nadzorna ploča</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarMenu>

            <div className="mx-2">
              <SidebarSeparator className="ml-0 mt-2" />
            </div>
          </div>
        )}

        <div>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupContent>
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.id}>
                      {item.comingSoon && !userIsAdmin ? (
                        <SidebarMenuButton type="button" disabled>
                          <Icon />
                          <span>{item.label}</span>

                          <Badge className="ml-auto text-[10px]">USKORO</Badge>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          className={cn(isActive && "hover:text-primary")}
                        >
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 relative",
                              isActive && "font-bold text-primary",
                            )}
                          >
                            <Icon className={isActive ? "text-primary" : ""} />
                            <span>{item.label}</span>

                            {item.badge && hasNotifications && (
                              <Badge className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {notifications.length}
                              </Badge>
                            )}

                            {item.comingSoon && (
                              <Badge className="ml-auto text-[10px]">
                                USKORO
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarMenu>

          <div className="mx-2">
            <SidebarSeparator className="ml-0 mt-2" />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {productNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  {renderProductNavItem(item)}

                  {item.children && item.children.length > 0 && (
                    <ul className="ml-3.5 mt-1 flex flex-col gap-1 border-l border-sidebar-border pl-1.5">
                      {item.children.map((child) => (
                        <SidebarMenuItem key={child.id}>
                          {renderProductNavItem(child)}
                        </SidebarMenuItem>
                      ))}
                    </ul>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        </SidebarContent>

        <ScrollFade targetRef={contentRef} className="from-sidebar" />
      </div>

      <SidebarFooter>
        <InstallSidebarBanner />

        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
});
