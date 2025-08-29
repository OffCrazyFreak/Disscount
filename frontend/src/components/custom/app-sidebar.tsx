"use client";

import {
  ChevronDown,
  List,
  CreditCard,
  MapPin,
  Percent,
  ListChecks,
  ChartNoAxesCombined,
} from "lucide-react";

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

import { useState } from "react";
import ProductSearchBar from "@/app/products/components/product-search-bar";

type MenuSubItem = {
  id: string;
  title: string;
  url: string;
};

const mockCategories: MenuSubItem[] = [
  {
    id: "0",
    title: "Elektronika",
    url: "/products?filterBy=category&subcategory=electronics",
  },
  {
    id: "1",
    title: "Odjeća",
    url: "/products?filterBy=category&subcategory=clothing",
  },
  {
    id: "2",
    title: "Hrana",
    url: "/products?filterBy=category&subcategory=food",
  },
];

const mockPlaces: MenuSubItem[] = [
  {
    id: "0",
    title: "Delnice",
    url: "/products?filterBy=place&subcategory=delnice",
  },
  {
    id: "1",
    title: "Zagreb",
    url: "/products?filterBy=place&subcategory=zagreb",
  },
];

export function AppSidebar() {
  const [categories, setCategories] = useState<MenuSubItem[]>(mockCategories);
  const [places, setPlaces] = useState<MenuSubItem[]>(mockPlaces);

  return (
    <Sidebar variant="floating" className="mt-24 h-max">
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
                    <SidebarMenuSub>
                      {categories.map((category) => (
                        <SidebarMenuSubItem key={category.id}>
                          <a href={category.url}>
                            <span>{category.title}</span>
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
                        <MapPin />
                        <span>Naselja</span>

                        <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">Toggle</span>
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {places.map((place) => (
                        <SidebarMenuSubItem key={place.id}>
                          <a href={place.url}>
                            <span>{place.title}</span>
                          </a>
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
}
