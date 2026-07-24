import type { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";

/** Group chrome shared by the product nav and the skeleton that stands in for it. */
export default function SidebarProductNavShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Istraži</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
