"use client";

import { type ReactNode } from "react";
import ReactQueryProviderWrapper from "@/app/providers/react-query-provider";
import SidebarProvider from "@/app/providers/sidebar-provider";
import ToasterProvider from "@/app/providers/toaster-provider";
import UserContextProvider from "@/app/providers/user-provider";
import ReactScan from "@/app/providers/react-scan";
import { CameraScannerProvider } from "@/context/scanner-context";
import { NotificationsProvider } from "@/context/notifications-context";
import RequestPersistentStorage from "@/components/custom/pwa/request-persistent-storage";
import AppleSplashScreens from "@/components/custom/pwa/apple-splash-screens";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <CameraScannerProvider>
              <ToasterProvider>
                <ReactScan />
                <RequestPersistentStorage />
                <AppleSplashScreens />

                {children}
              </ToasterProvider>
            </CameraScannerProvider>
          </SidebarProvider>
        </NotificationsProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
