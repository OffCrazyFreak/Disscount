"use client";

import { type ReactNode } from "react";
import { ReactQueryProviderWrapper } from "@/app/providers/react-query-provider";
import { SidebarProvider } from "@/app/providers/sidebar-provider";
import { ToasterProvider } from "@/app/providers/toaster-provider";
import { UserContextProvider } from "@/app/providers/user-provider";
import { ReactScan } from "@/app/providers/react-scan";
import { CameraScannerProvider } from "@/context/scanner-context";
import { NotificationsProvider } from "@/context/notifications-context";
import { AuthModalProvider } from "@/context/auth-modal-context";
import RequestPersistentStorage from "@/components/custom/pwa/request-persistent-storage";
import AppleSplashScreens from "@/components/custom/pwa/apple-splash-screens";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <CameraScannerProvider>
              <ToasterProvider>
                <AuthModalProvider>
                  <ReactScan />
                  <RequestPersistentStorage />
                  <AppleSplashScreens />

                  {children}
                </AuthModalProvider>
              </ToasterProvider>
            </CameraScannerProvider>
          </SidebarProvider>
        </NotificationsProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
