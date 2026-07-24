"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarMenuItem, SidebarMenuSub } from "@/components/ui/sidebar";
import SidebarProductNavShell from "@/components/custom/sidebar/sidebar-product-nav-shell";
import SidebarNavItem from "@/components/custom/sidebar/sidebar-nav-item";
import SidebarFilterMenu from "@/components/custom/sidebar/sidebar-filter-menu";
import SidebarFilterMenuSkeleton from "@/components/custom/sidebar/sidebar-filter-menu-skeleton";
import { useSidebarFilterOptions } from "@/hooks/use-sidebar-filter-options";
import {
  productNavItems,
  PLACEHOLDER_HREF,
  type INavigationItem,
} from "@/constants/navigation";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { readListParam } from "@/utils/generic";
import { useClientSearchParams } from "@/hooks/use-client-search-params";

type OpenSection = "stores" | "locations" | null;

/** Ways into the product catalogue: discounts, the map and its filters. */
export default function SidebarProductNav() {
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const pathname = usePathname();
  const searchParams = useClientSearchParams();
  const { user } = useUser();
  const { chains, cities } = useSidebarFilterOptions();

  const userIsAdmin = isAdmin(user?.accountType);
  const isOnProducts = pathname.startsWith("/products");

  const searchParamsString = searchParams?.toString() ?? "";
  const fullPath = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`;

  function isItemActive(item: INavigationItem): boolean {
    if (item.id === "discounted") {
      return isOnProducts && searchParams?.get("discounted") === "true";
    }

    return item.href !== PLACEHOLDER_HREF && fullPath.startsWith(item.href);
  }

  function renderFilterMenu(child: INavigationItem) {
    const isStores = child.id === "stores";

    return (
      <SidebarFilterMenu
        key={child.id}
        item={child}
        filterKey={isStores ? "chain" : "location"}
        options={isStores ? chains : cities}
        selected={
          isOnProducts && searchParams
            ? readListParam(searchParams, isStores ? "chain" : "location", {
                legacyCsv: true,
              })
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
    <SidebarProductNavShell>
      {productNavItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarNavItem
            item={item}
            isActive={isItemActive(item)}
            isLocked={Boolean(item.comingSoon) && !userIsAdmin}
          />

          {item.children?.length ? (
            <Suspense
              fallback={
                <SidebarFilterMenuSkeleton count={item.children.length} />
              }
            >
              <SidebarMenuSub className="gap-0">
                {item.children.map(renderFilterMenu)}
              </SidebarMenuSub>
            </Suspense>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarProductNavShell>
  );
}
