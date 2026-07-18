import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/app/globals.css";

import AppSidebar from "@/components/custom/app-sidebar";
import Header from "@/components/custom/header/header";
import Footer from "@/components/custom/footer";
import OAuthErrorToast from "@/components/custom/oauth-error-toast";
import ModalRouter from "@/components/custom/modal-router/modal-router";
import InstallBanner from "@/components/custom/pwa/install-banner";
import OfflineIndicator from "@/components/custom/offline/offline-indicator";
import Providers from "@/app/providers/providers";
import { ReactNode, Suspense } from "react";
import { sairaStencil } from "@/app/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    template: "Disscount - %s",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Disscount",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  creator: "Jakov Jakovac",
  keywords: [
    "disscount",
    "disscount app",
    "disscount hr",
    "disscount hrvatska",
    "najbolje cijene",
    "shopping list",
    "shopping lists",
    "popisi za kupnju",
    "popis za kupnju",
    "digital cards",
    "digitalne kartice",
    "loyalty cards",
    "loyalty card",
    "price comparison",
    "price tracker",
    "praćenje cijena",
    "usporedba cijena",
    "deal alerts",
    "barcode scanner",
    "ai suggestions",
    "discounts",
    "discount",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="hr" data-scroll-behavior="smooth">
      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      )}
      <body
        className={`${sairaStencil.variable} antialiased bg-zinc-50 relative`}
      >
        <Providers>
          <OfflineIndicator />
          <InstallBanner />

          <Suspense fallback={null}>
            <OAuthErrorToast />
          </Suspense>

          <Suspense fallback={null}>
            <ModalRouter />
          </Suspense>

          <div className="min-h-screen flex flex-col w-full">
            {/* pattern background */}
            <div className="absolute inset-0 z-[-15] bg-[url('/+_pattern.png')] bg-repeat opacity-100" />
            {/* radial fade overlay to white */}
            <div className="absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#ffffff_90%)]" />
            {/* linear gradient from center to left and right */}
            <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.0)_70%,rgba(255,255,255,0.9)_100%)]" />

            <Header />

            <aside>
              <Suspense fallback={null}>
                <AppSidebar />
              </Suspense>
            </aside>

            <main className="max-w-4xl mx-auto p-4 mt-24 w-full overflow-y-hidden">
              {children}
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
