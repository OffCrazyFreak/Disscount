"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import SidebarNavItem from "@/components/custom/sidebar-nav-item";
import SidebarFilterMenu from "@/components/custom/sidebar-filter-menu";
import { useSidebarFilterOptions } from "@/hooks/use-sidebar-filter-options";
import { productNavItems, type NavigationItem } from "@/constants/navigation";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { parseListParam } from "@/utils/generic";

type OpenSection = "stores" | "locations" | null;

/** Ways into the product catalogue: discounts, the map and its filters. */
export default function SidebarProductNav() {
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { chains, cities } = useSidebarFilterOptions();

  const userIsAdmin = isAdmin(user?.accountType);
  const isOnProducts = pathname.startsWith("/products");

  const searchParamsString = searchParams.toString();
  const fullPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`;

  function isItemActive(item: NavigationItem): boolean {
    if (item.id === "discounted") {
      return isOnProducts && searchParams.get("discounted") === "true";
    }

    return item.href !== "#" && fullPath.startsWith(item.href);
  }

  function renderFilterMenu(child: NavigationItem) {
    const isStores = child.id === "stores";

    return (
      <SidebarFilterMenu
        key={child.id}
        item={child}
        filterKey={isStores ? "chain" : "location"}
        options={isStores ? chains : cities}
        selected={
          isOnProducts
            ? parseListParam(searchParams.get(isStores ? "chain" : "location"))
            : []
        }
        isOpen={openMenu === child.id}
        onOpenChange={(open) =>
          setOpenMenu(open ? (child.id as OpenSection) : null)
        }
      />
    );
  }

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Istraži</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {productNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarNavItem
                item={item}
                isActive={isItemActive(item)}
                isLocked={Boolean(item.comingSoon) && !userIsAdmin}
              />

              {item.children?.length ? (
                <SidebarMenuSub className="gap-0">
                  {item.children.map(renderFilterMenu)}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
