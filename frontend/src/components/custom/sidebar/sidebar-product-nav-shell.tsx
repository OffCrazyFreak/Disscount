import type { ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";

interface ISidebarProductNavShellProps {
  children: ReactNode;
}

/** Group chrome shared by the product nav and the skeletons standing in for it. */
export default function SidebarProductNavShell({
  children,
}: ISidebarProductNavShellProps) {
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>Istraži</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
