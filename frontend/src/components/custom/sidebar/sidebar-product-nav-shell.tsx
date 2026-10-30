import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("shell");

  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel>{t("sidebar.explore")}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-0">{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
