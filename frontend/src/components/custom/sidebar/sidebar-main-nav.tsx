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
  userNavItems,
  isNavItemLocked,
} from "@/constants/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useUser } from "@/context/user-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";
import { isRouteActive } from "@/utils/routes";

/** The signed-in user's own pages, plus the dashboard link on mobile. */
export default function SidebarMainNav() {
  const pathname = usePathname();
  const { notifications, hasNotifications } = useNotifications();
  const { user } = useUser();

  return (
    <>
      {canAccessDashboard(user?.accountType) && (
        <SidebarGroup className="py-1 md:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarNavItem
                  item={dashboardNavItem}
                  isActive={isRouteActive(pathname, dashboardNavItem.href)}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

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
