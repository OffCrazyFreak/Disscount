"use client";

import { type ReactNode } from "react";
import { ReactQueryProviderWrapper } from "@/app/providers/react-query-provider";
import { SidebarProvider } from "@/app/providers/sidebar-provider";
import { ToasterProvider } from "@/app/providers/toaster-provider";
import { UserContextProvider } from "@/app/providers/user-provider";
import { ReactScan } from "@/app/providers/react-scan";
import { CameraScannerProvider } from "@/context/scanner-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <SidebarProvider>
          <CameraScannerProvider>
            <ToasterProvider>
              <ReactScan />

              {children}
            </ToasterProvider>
          </CameraScannerProvider>
        </SidebarProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
