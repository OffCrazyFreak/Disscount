"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarNavItem from "@/components/custom/sidebar/sidebar-nav-item";
import { supportNavItems, isNavItemLocked } from "@/constants/navigation";
import { useUser } from "@/context/user-context";

/** Support entry points: feedback, contact and voluntary project support. */
export default function SidebarSupportNav() {
  const { user } = useUser();

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Pomoć i podrška</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {supportNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarNavItem
                item={item}
                isLocked={isNavItemLocked(item, user?.accountType)}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
