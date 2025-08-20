"use client";

import { type ReactNode } from "react";
import { AuthUIProviderWrapper } from "./providers/auth-ui-provider";
import { AuthProvider } from "./providers/auth-provider";
import { ReactQueryProviderWrapper } from "./providers/react-query-provider";
import { SidebarProvider } from "./providers/sidebar-provider";
import { ToasterProvider } from "./providers/toaster-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthUIProviderWrapper>
      <ReactQueryProviderWrapper>
        <AuthProvider>
          <SidebarProvider>
            <ToasterProvider>{children}</ToasterProvider>
          </SidebarProvider>
        </AuthProvider>
      </ReactQueryProviderWrapper>
    </AuthUIProviderWrapper>
  );
}
