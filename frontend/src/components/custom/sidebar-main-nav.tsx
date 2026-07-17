"use client";

import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarNavItem from "@/components/custom/sidebar-nav-item";
import { dashboardNavItem, userNavItems } from "@/constants/navigation";
import { useNotifications } from "@/context/notifications-context";
import { useUser } from "@/context/user-context";
import { canAccessDashboard, isAdmin } from "@/lib/api/schemas/auth-user";

/** The signed-in user's own pages, plus the dashboard link on mobile. */
export default function SidebarMainNav() {
  const pathname = usePathname();
  const { notifications, hasNotifications } = useNotifications();
  const { user } = useUser();

  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <>
      {canAccessDashboard(user?.accountType) && (
        <SidebarGroup className="py-1 md:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarNavItem
                  item={dashboardNavItem}
                  isActive={pathname.startsWith("/dashboard")}
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
                  isActive={pathname.startsWith(item.href)}
                  isLocked={Boolean(item.comingSoon) && !userIsAdmin}
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
