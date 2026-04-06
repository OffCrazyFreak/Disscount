"use client";

import { memo, useMemo, useState, Suspense, useEffect } from "react";
import { ChevronDown, MapPin, Percent } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import cijeneService from "@/lib/cijene-api";
import { ChainStats } from "@/lib/cijene-api/schemas";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { storeNamesMap } from "@/constants/name-mappings";
import SearchBar from "@/components/custom/search-bar";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { productNavItems, userNavItems } from "@/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/notifications-context";

type OpenSection = "categories" | "stores" | "locations" | null;

export const AppSidebar = memo(function AppSidebar() {
  const [categories, setCategories] = useState<string[]>(["First", "Second"]);
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const { setOpen, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { notifications, hasNotifications } = useNotifications();

  const { data: chainStats, isLoading: chainStatsLoading } =
    cijeneService.useGetChainStats();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
    setOpenMobile(false);
  }, [pathname]);

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

  return (
    <Sidebar variant="floating" className="mt-24 h-fit">
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

            <span className="font-bold text-lg sm:text-xl text-primary">
              Disscount
            </span>
          </Link>

          <SidebarTrigger className="m-0 p-0 text-gray-800" />
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense>
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

      <SidebarContent className="max-h-[75dvh] min-h-0 overflow-y-auto">
        <div>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupContent>
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem
                      key={item.id}
                      className={cn(item.showInHeader && "md:hidden")}
                    >
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
                            <Badge className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500 text-white hover:bg-green-600">
                              {notifications.length}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
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
              {productNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                if (item.isCollapsible) {
                  const isStoresOpen =
                    item.id === "stores" && openMenu === "stores";
                  const isLocationsOpen =
                    item.id === "locations" && openMenu === "locations";
                  const isCategoriesOpen =
                    item.id === "categories" && openMenu === "categories";
                  const isOpen =
                    isStoresOpen || isLocationsOpen || isCategoriesOpen;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <Collapsible
                        open={isOpen}
                        onOpenChange={(open) =>
                          setOpenMenu(open ? (item.id as OpenSection) : null)
                        }
                        className="group/collapsible"
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton asChild>
                            <button
                              type="button"
                              className="cursor-pointer group"
                            >
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
                                    className={`flex justify-between items-center ${
                                      pathname.includes(
                                        encodeURIComponent(category),
                                      )
                                        ? "text-primary font-bold"
                                        : ""
                                    }`}
                                    href={`/products?category=${encodeURIComponent(
                                      category,
                                    )}`}
                                  >
                                    <span>{category}</span>
                                  </Link>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}

                          {item.id === "stores" && (
                            <SidebarMenuSub className="max-h-160 overflow-y-auto">
                              {sortedChainStats.map((chain) => (
                                <SidebarMenuSubItem
                                  className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                                  key={chain.chain_code}
                                >
                                  <Link
                                    className="flex justify-between items-center"
                                    href={`/products?chain=${encodeURIComponent(
                                      chain.chain_code,
                                    )}`}
                                  >
                                    <span>
                                      {storeNamesMap[chain.chain_code]}
                                    </span>
                                    <span>{`(${chain.store_count})`}</span>
                                  </Link>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}

                          {item.id === "locations" && (
                            <SidebarMenuSub className="max-h-160 overflow-y-auto">
                              {sortedLocations.map((location) => (
                                <SidebarMenuSubItem
                                  className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                                  key={location.name}
                                >
                                  <Link
                                    className="flex justify-between items-center"
                                    href={`/products?location=${encodeURIComponent(
                                      location.name,
                                    )}`}
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
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.id}>
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
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* <SidebarFooter>
        Za sve primjedbe i pohvale se javite na example@domain.com
      </SidebarFooter> */}
    </Sidebar>
  );
});
