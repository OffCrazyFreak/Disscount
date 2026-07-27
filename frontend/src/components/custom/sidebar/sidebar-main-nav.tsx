"use client";

import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarNavItem from "@/components/custom/sidebar/sidebar-nav-item";
import {
  dashboardNavItem,
  homeNavItem,
  userNavItems,
  isNavItemLocked,
} from "@/constants/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useUser } from "@/context/user-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { isRouteActive } from "@/utils/routes";

/** The homepage, mobile dashboard link and signed-in user's own pages. */
export default function SidebarMainNav() {
  const pathname = usePathname();
  const { notifications, hasNotifications } = useNotifications();
  const { user } = useUser();

  return (
    <>
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarNavItem
                item={homeNavItem}
                isActive={isRouteActive(pathname, homeNavItem.href)}
              />
            </SidebarMenuItem>

            {canAccessDashboard(user?.accountType) && (
              <SidebarMenuItem className="md:hidden">
                <SidebarNavItem
                  item={dashboardNavItem}
                  isActive={isRouteActive(pathname, dashboardNavItem.href)}
                />
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="py-1">
        <SidebarGroupLabel>Moj račun</SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            {userNavItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarNavItem
                  item={item}
                  isActive={isRouteActive(pathname, item.href)}
                  isLocked={isNavItemLocked(item, user?.accountType)}
                  badgeCount={
                    item.badge && hasNotifications
                      ? notifications.length
                      : undefined
                  }
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
