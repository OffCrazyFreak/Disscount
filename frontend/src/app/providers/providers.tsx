"use client";

import { type ReactNode } from "react";
import ReactQueryProviderWrapper from "@/app/providers/react-query-provider";
import SidebarProvider from "@/app/providers/sidebar-provider";
import ToasterProvider from "@/app/providers/toaster-provider";
import UserContextProvider from "@/app/providers/user-provider";
import ReactScan from "@/app/providers/react-scan";
import { CameraScannerProvider } from "@/context/scanner-context";
import { NotificationsProvider } from "@/context/notifications-context";
import { ProductsSheetProvider } from "@/context/products-sheet-context";
import RequestPersistentStorage from "@/components/custom/pwa/request-persistent-storage";
import AppleSplashScreens from "@/components/custom/pwa/apple-splash-screens";
import ScanShortcut from "@/components/custom/pwa/scan-shortcut";

interface IProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: IProvidersProps) {
  return (
    <ReactQueryProviderWrapper>
      <UserContextProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <CameraScannerProvider>
              <ProductsSheetProvider>
                <ToasterProvider>
                  <ReactScan />
                  <RequestPersistentStorage />
                  <AppleSplashScreens />
                  <ScanShortcut />

                  {children}
                </ToasterProvider>
              </ProductsSheetProvider>
            </CameraScannerProvider>
          </SidebarProvider>
        </NotificationsProvider>
      </UserContextProvider>
    </ReactQueryProviderWrapper>
  );
}
