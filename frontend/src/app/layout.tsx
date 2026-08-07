import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/app/globals.css";

import AppSidebar from "@/components/custom/sidebar/app-sidebar";
import BottomNav from "@/components/custom/bottom-nav/bottom-nav";
import ProductsSheet from "@/components/custom/products-sheet/products-sheet";
import Header from "@/components/custom/header/header";
import Footer from "@/components/custom/common/footer";
import WindowScrollFade from "@/components/custom/common/window-scroll-fade";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";
import OAuthErrorToast from "@/components/custom/common/oauth-error-toast";
import ModalRouter from "@/components/custom/modal-router/modal-router";
import InstallBanner from "@/components/custom/pwa/install-banner";
import OfflineIndicator from "@/components/custom/offline/offline-indicator";
import Providers from "@/app/providers/providers";
import { ReactNode, Suspense } from "react";
import { huninn, sairaStencil } from "@/app/fonts";
import { appUrl } from "@/lib/env";

// Social previews truncate near 125 chars, so this is shorter than the meta one.
const socialDescription =
  "Usporedi cijene proizvoda u 25+ trgovačkih lanaca u Hrvatskoj, prati povijest cijena i uštedi pri svakoj kupnji. Besplatno.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    template: "Disscount - %s",
  },
  description:
    "Usporedi cijene proizvoda u 25+ trgovačkih lanaca u Hrvatskoj, prati povijest cijena, izradi pametne popise za kupnju i uštedi pri svakoj kupnji. Besplatno.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: "/",
    siteName: "Disscount",
    title: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    description: socialDescription,
  },
  twitter: {
    card: "summary_large_image",
    site: "@disscountme",
    creator: "@disscountme",
    title: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    description: socialDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Disscount",
  },
  icons: {
    icon: [
      { url: "/brand/icons/icon.svg", type: "image/svg+xml" },
      { url: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/brand/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      { rel: "mask-icon", url: "/brand/icons/mask-icon.svg", color: "#2ec50d" },
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  // Without this every env(safe-area-inset-*) resolves to 0, so the bottom nav
  // would sit under the iOS home indicator.
  viewportFit: "cover",
  // Shrinks the layout viewport when the keyboard opens, so fixed bottom
  // elements reposition instead of hiding behind it. Chrome Android 108+,
  // Firefox Android 133+ and Samsung Internet; iOS Safari ignores it.
  interactiveWidget: "resizes-content",
};

interface IRootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: Readonly<IRootLayoutProps>) {
  return (
    <html
      lang="hr"
      data-scroll-behavior="smooth"
      className="scroll-pb-[var(--bottom-nav-total)] md:scroll-pb-0"
    >
      {/* Chrome fires beforeinstallprompt before React hydrates, and never
          re-fires it, so the React-side listener alone can miss it and lose the
          native prompt. use-install-prompt.ts adopts whatever this catches. */}
      <Script id="install-prompt-capture" strategy="beforeInteractive">
        {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;});`}
      </Script>

      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      )}
      <body
        className={`${sairaStencil.variable} ${huninn.variable} antialiased bg-zinc-50 relative`}
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

          {/* The clearance sits here, not on <main>: the footer renders after
              main with mt-auto, so it is the element the bar would cover. */}
          <div className="min-h-svh flex flex-col w-full pb-[calc(var(--bottom-nav-total)+0.5rem)] md:pb-0">
            {/* pattern background */}
            <div className="absolute inset-0 z-[-15] bg-[url('/+_pattern.png')] bg-repeat opacity-100" />
            {/* radial fade to white, spreading from the page centre outward */}
            <div className="absolute inset-0 -z-10 [background:radial-gradient(100%_100%_at_50%_50%,transparent_0%,#ffffff_60%)]" />
            {/* linear gradient from center to left and right */}
            <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.0)_70%,rgba(255,255,255,0.9)_100%)]" />

            <Header />

            <aside>
              <Suspense fallback={null}>
                <AppSidebar />
              </Suspense>
            </aside>

            {/* Clip the x axis only. Clipping both axes cut the last child's
                bottom border and shadow off, since main has no bottom padding. */}
            <main className="max-w-4xl mx-auto px-4 pt-4 mt-24 w-full overflow-x-clip">
              {children}
            </main>

            <Footer />

            {/* Bottom scrim on every scrollable page; self-hides at the end */}
            <WindowScrollFade />

            {/* Desktop only, and only past 600px of scroll, so a short page
                never shows one and no page has to opt in */}
            <BackToTopButton />

            <BottomNav />
          </div>

          <Suspense fallback={null}>
            <ProductsSheet />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
