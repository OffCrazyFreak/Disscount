"use client";

import { type ReactNode } from "react";
import { ReactQueryProviderWrapper } from "@/app/providers/react-query-provider";
import { SidebarProvider } from "@/app/providers/sidebar-provider";
import { ToasterProvider } from "@/app/providers/toaster-provider";
import { UserContextProvider } from "@/app/providers/user-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <SidebarProvider>
          <ToasterProvider>{children}</ToasterProvider>
        </SidebarProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
