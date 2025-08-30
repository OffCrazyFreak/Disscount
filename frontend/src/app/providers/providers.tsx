"use client";

import { type ReactNode } from "react";
import { ReactQueryProviderWrapper } from "@/app/providers/react-query-provider";
import { SidebarProvider } from "@/app/providers/sidebar-provider";
import { ToasterProvider } from "@/app/providers/toaster-provider";
import { UserContextProvider } from "@/app/providers/user-provider";
import { ReactScan } from "./react-scan";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <SidebarProvider>
          <ToasterProvider>
            <ReactScan />

            {children}
          </ToasterProvider>
        </SidebarProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
