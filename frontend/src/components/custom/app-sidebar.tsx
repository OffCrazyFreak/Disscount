"use client";

import { memo, useMemo, useState, Suspense } from "react";
import {
  ChevronDown,
  List,
  CreditCard,
  MapPin,
  Percent,
  ListChecks,
  ChartNoAxesCombined,
  Store,
} from "lucide-react";

import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import cijeneService from "@/lib/cijene-api";
import { ChainStats } from "@/lib/cijene-api/schemas";
import { useAllLocations } from "@/lib/cijene-api/hooks";
import { ProductSearchBar } from "@/app/products/components/product-search-bar";
import { storeNamesMap } from "@/utils/mappings";
import { Button } from "../ui/button-icon";

type OpenSection = "categories" | "stores" | "locations" | null;

export const AppSidebar = memo(function AppSidebar() {
  const [categories, setCategories] = useState<any[]>(["First", "Second"]);
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);

  const { data: chainStats, isLoading: chainStatsLoading } =
    cijeneService.useGetChainStats();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

  const sortedChainStats = useMemo(() => {
    const list = chainStats?.chain_stats ?? [];
    return [...list].sort((a, b) => a.chain_code.localeCompare(b.chain_code));
  }, [chainStats]);

  const sortedLocations = useMemo(() => {
    const list = locations ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  return (
    <Sidebar variant="floating" className="mt-24 h-fit">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense>
              <ProductSearchBar />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="max-h-[75dvh] min-h-0 overflow-y-auto">
        <div className="sm:hidden">
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/shopping-lists"
                      className="flex items-center gap-2"
                    >
                      <ListChecks />
                      <span>Popisi za kupnju</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/digital-cards"
                      className="flex items-center gap-2"
                    >
                      <CreditCard />
                      <span>Digitalne kartice</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarMenu>

          <div className="mx-4">
            <SidebarSeparator className="ml-0 mt-2" />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/products?discounted=true">
                    <Percent />
                    <span>Sniženja</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={openMenu === "categories"}
                  onOpenChange={(open) =>
                    setOpenMenu(open ? "categories" : null)
                  }
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <button type="button" className="cursor-pointer group">
                        <List />
                        <span>Kategorije</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="max-h-128 overflow-y-auto">
                      {categories.map((category) => (
                        <SidebarMenuSubItem key={category.id || category}>
                          <Link href={category.url || "#"}>
                            <span>{category.title || category}</span>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={openMenu === "stores"}
                  onOpenChange={(open) => setOpenMenu(open ? "stores" : null)}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <button type="button" className="cursor-pointer group">
                        <Store />
                        <span>Trgovine</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="max-h-160 overflow-y-auto">
                      {sortedChainStats.map((chain: ChainStats) => (
                        <SidebarMenuSubItem
                          className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                          key={chain.chain_code}
                        >
                          <Link
                            className="flex justify-between items-center"
                            href={`/products?chain=${chain.chain_code}`}
                          >
                            <span>{storeNamesMap[chain.chain_code]}</span>

                            <span className="">{`(${chain.store_count})`}</span>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible
                  open={openMenu === "locations"}
                  onOpenChange={(open) =>
                    setOpenMenu(open ? "locations" : null)
                  }
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <button type="button" className="cursor-pointer group">
                        <MapPin />
                        <span>Lokacije</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="max-h-160 overflow-y-auto">
                      {sortedLocations.map((location) => (
                        <SidebarMenuSubItem
                          className="hover:bg-gray-200 rounded-md px-2 hover:text-gray-900"
                          key={location.name}
                        >
                          <Link
                            className="flex justify-between items-center"
                            href={`/products?location=${location.name}`}
                          >
                            <span>{location.name}</span>

                            <span className="">{`(${location.storeCount})`}</span>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/statistics"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <ChartNoAxesCombined />
                    <span>Statistika</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
