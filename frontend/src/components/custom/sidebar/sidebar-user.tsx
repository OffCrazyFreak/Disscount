"use client";

import { ChevronsUpDown } from "lucide-react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import UserMenu from "@/components/custom/user-menu/user-menu";
import NotificationsDropdown from "@/components/custom/notifications/notifications-dropdown";
import { useUser } from "@/context/user-context";

/**
 * Mobile-only sidebar footer row: the same user menu and notifications the
 * header shows on desktop, where its trigger isn't reachable from the sheet.
 */
export default function SidebarUser() {
  const { user, isAuthenticated } = useUser();

  if (!isAuthenticated || !user) return null;

  const avatarUser = {
    name: user.username || "",
    email: user.email || "",
    image: user.image || null,
  };

  return (
    <SidebarMenu className="md:hidden">
      <SidebarMenuItem className="flex items-center gap-1">
        <UserMenu
          side="top"
          trigger={
            <SidebarMenuButton
              size="lg"
              className="flex-1 cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                className="text-sm font-bold"
                user={avatarUser}
                size="lg"
              />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">{user.username}</span>
                <span className="truncate text-xs text-gray-400">
                  {user.email}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          }
        />

        <NotificationsDropdown />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
