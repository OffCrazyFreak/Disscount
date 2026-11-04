import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/app/globals.css";

import AppSidebar from "@/components/custom/sidebar/app-sidebar";
import BottomNav from "@/components/custom/bottom-nav/bottom-nav";
import PriceDropStatus from "@/components/custom/watchlist/price-drop-status";
import ProductsSheet from "@/app/[locale]/products/components/products-sheet/products-sheet";
import Header from "@/components/custom/header/header";
import Footer from "@/components/custom/common/footer";
import SkipLink, {
  MAIN_CONTENT_ID,
} from "@/components/custom/common/skip-link";
import WindowScrollFade from "@/components/custom/common/window-scroll-fade";
import BackToTopButton from "@/components/custom/fab/back-to-top-button";
import OAuthErrorToast from "@/components/custom/common/oauth-error-toast";
import ModalRouter from "@/app/[locale]/components/modal-router/modal-router";
import InstallBanner from "@/components/custom/pwa/install-banner";
import OfflineIndicator from "@/components/custom/offline/offline-indicator";
import Providers from "@/app/providers/providers";
import LocaleSync from "@/components/custom/locale/locale-sync";
import ZodLocale from "@/components/custom/locale/zod-locale";
import LocaleSuggestion from "@/components/custom/locale/locale-suggestion";
import { ReactNode, Suspense } from "react";
import { isIndexableOrigin } from "@/utils/indexing";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { LOCALES, OPEN_GRAPH_LOCALES } from "@/i18n/locales";
import { baselineEllipsis, huninn, sairaStencil } from "@/app/fonts";
import { appUrl, clientEnv } from "@/lib/env";
import { iosStartupImages } from "@/constants/ios-startup-images";
import { X_HANDLE } from "@/constants/social";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata");
  const indexable = isIndexableOrigin(clientEnv.NEXT_PUBLIC_APP_URL);

  return {
    metadataBase: new URL(appUrl()),
    title: {
      default: t("title"),
      template: "Disscount - %s",
    },
    description: t("description"),
    alternates: {
      canonical: "./",
    },
    openGraph: {
      type: "website",
      locale: OPEN_GRAPH_LOCALES[locale],
      siteName: "Disscount",
      title: t("title"),
      // Social previews truncate near 125 chars, so this is shorter than the meta one.
      description: t("socialDescription"),
    },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title: t("title"),
      description: t("socialDescription"),
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Disscount",
      startupImage: iosStartupImages,
    },
    icons: {
      icon: [
        { url: "/brand/icons/icon.svg", type: "image/svg+xml" },
        {
          url: "/brand/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/brand/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: "/brand/icons/apple-touch-icon-180.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/brand/icons/mask-icon.svg",
          color: "#2ec50d",
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
      index: indexable,
      follow: indexable,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  // Without this every env(safe-area-inset-*) resolves to 0, so the bottom nav would sit under the iOS home indicator.
  viewportFit: "cover",
  // Shrinks the layout viewport when the keyboard opens, so fixed bottom elements reposition instead of hiding behind it; iOS Safari ignores it.
  interactiveWidget: "resizes-content",
};

interface IRootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({
  children,
}: Readonly<IRootLayoutProps>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className="scroll-pb-[var(--bottom-nav-total)] md:scroll-pb-0"
    >
      <body
        className={`${sairaStencil.variable} ${baselineEllipsis.variable} ${huninn.variable} antialiased bg-zinc-50 relative`}
      >
        <SkipLink />

        {/* Chrome fires beforeinstallprompt before hydration and never again, so a React listener alone can lose it; React rejects a script directly in html. */}
        <Script id="install-prompt-capture" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;});`}
        </Script>

        {clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={clientEnv.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}

        <NextIntlClientProvider>
          <Providers>
            <LocaleSync />
            <ZodLocale />
            <OfflineIndicator />
            <InstallBanner />

            <Suspense fallback={null}>
              <OAuthErrorToast />
            </Suspense>

            <Suspense fallback={null}>
              <ModalRouter />
            </Suspense>

            {/* Here, not on <main>, because the footer renders after main with mt-auto and is the element the bar would cover. */}
            <div className="min-h-svh md:has-[[data-page-width=full]]:h-svh md:has-[[data-page-width=full]]:min-h-[40rem] flex flex-col w-full pb-[calc(var(--bottom-nav-total)+0.5rem)] md:pb-0">
              <div className="absolute inset-0 z-[-15] bg-[url('/+_pattern.png')] bg-repeat opacity-100" />
              <div className="absolute inset-0 -z-10 [background:radial-gradient(100%_100%_at_50%_50%,transparent_0%,#ffffff_60%)]" />
              <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.0)_70%,rgba(255,255,255,0.9)_100%)]" />

              <Header />

              <aside>
                <Suspense fallback={null}>
                  <AppSidebar />
                </Suspense>
              </aside>

              {/* Clip the x axis only, because clipping both cut the last child's bottom border and shadow, since main has no bottom padding. */}
              {/* data-page-width="full" makes one screen-tall wrapper so inner heights resolve; only a screen under 40rem scrolls, so the map never shrinks to nothing. */}
              <main
                id={MAIN_CONTENT_ID}
                tabIndex={-1}
                className="scroll-mt-24 outline-none max-w-4xl has-[[data-page-width=full]]:max-w-none has-[[data-page-width=full]]:flex has-[[data-page-width=full]]:flex-1 has-[[data-page-width=full]]:min-h-0 has-[[data-page-width=full]]:flex-col mx-auto px-4 pt-4 mt-24 w-full overflow-x-clip"
              >
                <Suspense fallback={null}>
                  <LocaleSuggestion />
                </Suspense>

                {children}
              </main>

              <Footer />

              <WindowScrollFade />

              {/* Only past 600px of scroll, so a short page never shows one and no page has to opt in. */}
              <BackToTopButton />

              <BottomNav />

              <PriceDropStatus />
            </div>

            <Suspense fallback={null}>
              <ProductsSheet />
            </Suspense>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
