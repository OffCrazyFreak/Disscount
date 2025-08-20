"use client";

import { type ReactNode } from "react";
import { AuthUIProviderWrapper } from "./providers/auth-ui-provider";
import { ReactQueryProviderWrapper } from "./providers/react-query-provider";
import { SidebarProvider } from "./providers/sidebar-provider";
import { ToasterProvider } from "./providers/toaster-provider";
import { UserContextProvider } from "./providers/user-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthUIProviderWrapper>
      <ReactQueryProviderWrapper>
        <UserContextProvider>
          <SidebarProvider>
            <ToasterProvider>{children}</ToasterProvider>
          </SidebarProvider>
        </UserContextProvider>
      </ReactQueryProviderWrapper>
    </AuthUIProviderWrapper>
  );
}
