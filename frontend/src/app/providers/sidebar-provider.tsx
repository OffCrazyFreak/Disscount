"use client";

import { SidebarProvider as SidebarContextProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

export function SidebarProvider({ children }: { children: ReactNode }) {
  return (
    <SidebarContextProvider defaultOpen={false}>
      {children}
    </SidebarContextProvider>
  );
}
