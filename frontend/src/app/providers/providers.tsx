"use client";

import { type ReactNode } from "react";
import { SerwistProvider } from "@serwist/next/react";
import ReactQueryProviderWrapper from "@/app/providers/react-query-provider";
import SidebarProvider from "@/app/providers/sidebar-provider";
import ToasterProvider from "@/app/providers/toaster-provider";
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
    <SerwistProvider
      swUrl="/sw.js"
      // In dev the service worker would fight Turbopack's hot reload, and a browser with no
      // Cache Storage rejects registration in a way nothing here can catch.
      disable={
        process.env.NODE_ENV === "development" || typeof caches === "undefined"
      }
      cacheOnNavigation={false}
      reloadOnOnline
      // Serwist defaults to a module worker, but sw.js is one bundled file and classic runs everywhere.
      options={{ type: "classic" }}
    >
      <ReactQueryProviderWrapper>
        <UserProvider>
          <NotificationsProvider>
            <SidebarProvider>
              <CameraScannerProvider>
                <ProductsSheetProvider>
                  <ToasterProvider>
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
    </SerwistProvider>
  );
}
