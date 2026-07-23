"use client";

import { SidebarProvider as SidebarContextProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

interface ISidebarProviderProps {
  children: ReactNode;
}

export default function SidebarProvider({ children }: ISidebarProviderProps) {
  return (
    <SidebarContextProvider defaultOpen={false}>
      {children}
    </SidebarContextProvider>
  );
}
