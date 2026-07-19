"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SidebarNavItem from "@/components/custom/sidebar/sidebar-nav-item";
import { supportNavItems } from "@/constants/navigation";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";

/** Feedback entry points: ideas board, bug reports and contact. */
export default function SidebarSupportNav() {
  const { user } = useUser();
  const userIsAdmin = isAdmin(user?.accountType);

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Pomoć i podrška</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">
          {supportNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarNavItem
                item={item}
                isLocked={Boolean(item.comingSoon) && !userIsAdmin}
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
