"use client";

import { memo, useMemo, useState } from "react";
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
import cijeneService from "@/app/products/api";
import { ChainStats } from "@/app/products/api/schemas";
import { useAllLocations } from "@/app/products/api/hooks";
import { ProductSearchBar } from "@/app/products/components/product-search-bar";
import { storeNamesMap } from "@/utils/mappings";

export const AppSidebar = memo(function AppSidebar() {
  const [categories, setCategories] = useState<any[]>(["First", "Second"]);

  const { data: chainStats, isLoading: chainStatsLoading } =
    cijeneService.useGetChainStats();

  const { data: locations, isLoading: locationsLoading } = useAllLocations();

  const sortedChainStats = useMemo(() => {
    return (
      chainStats?.chain_stats?.sort((a, b) =>
        a.chain_code.localeCompare(b.chain_code)
      ) || []
    );
  }, [chainStats]);

  const sortedLocations = useMemo(() => {
    return locations?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  }, [locations]);

  return (
    <Sidebar variant="floating" className="mt-24 h-fit">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <ProductSearchBar />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <div className="sm:hidden">
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={"/shopping-lists"}>
                      <ListChecks />
                      <span>Shopping liste</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href={"/digital-cards"}>
                      <CreditCard />
                      <span>Digitalne kartice</span>
                    </a>
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
                  <a
                    href="/products?filterBy=discount"
                    className="cursor-pointer"
                  >
                    <Percent />
                    <span>Sniženja</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <div className="cursor-pointer group">
                        <List />
                        <span>Kategorije</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub className="max-h-128 overflow-y-auto">
                      {categories.map((category) => (
                        <SidebarMenuSubItem key={category.id || category}>
                          <a href={category.url || "#"}>
                            <span>{category.title || category}</span>
                          </a>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <div className="cursor-pointer group">
                        <Store />
                        <span>Trgovine</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </div>
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
                            href={`/product?filterBy=chain&value=${chain.chain_code}`}
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
                <Collapsible defaultOpen={false} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild>
                      <div className="cursor-pointer group">
                        <MapPin />
                        <span>Lokacije</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </div>
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
                            href={`/product?filterBy=location&value=${location.name}`}
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
                  <a href="/statistics" className="cursor-pointer">
                    <ChartNoAxesCombined />
                    <span>Statistika</span>
                  </a>
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
