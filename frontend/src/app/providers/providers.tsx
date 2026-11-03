"use client";

import { type ReactNode } from "react";
import ReactQueryProviderWrapper from "@/app/providers/react-query-provider";
import SidebarProvider from "@/app/providers/sidebar-provider";
import ToasterProvider from "@/app/providers/toaster-provider";
import ReactScan from "@/app/providers/react-scan";
import { UserProvider } from "@/context/user-context";
import { CameraScannerProvider } from "@/context/scanner-context";
import { NotificationsProvider } from "@/context/notifications-context";
import { ProductsSheetProvider } from "@/context/products-sheet-context";
import RequestPersistentStorage from "@/components/custom/pwa/request-persistent-storage";
import ScanShortcut from "@/components/custom/pwa/scan-shortcut";
import AppUpdatePrompt from "@/components/custom/pwa/app-update-prompt";

interface IProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: IProvidersProps) {
  return (
    <ReactQueryProviderWrapper>
      <UserProvider>
        <NotificationsProvider>
          <SidebarProvider>
            <CameraScannerProvider>
              <ProductsSheetProvider>
                <ToasterProvider>
                  <ReactScan />
                  <RequestPersistentStorage />
                  <ScanShortcut />
                  <AppUpdatePrompt />

                  {children}
                </ToasterProvider>
              </ProductsSheetProvider>
            </CameraScannerProvider>
          </SidebarProvider>
        </NotificationsProvider>
      </UserProvider>
    </ReactQueryProviderWrapper>
  );
}
