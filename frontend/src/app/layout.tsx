import type { Metadata } from "next";
import "./globals.css";

import { AppSidebar } from "@/components/custom/app-sidebar";
import Header from "@/components/custom/header/header";
import Footer from "@/components/custom/footer";
import { Providers } from "@/app/providers/providers";
import { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://OffCrazyFreak.github.io/Disscount"),
  title: {
    default: "Disscount - Pronađi najbolje cijene u Hrvatskoj",
    template: "Disscount - %s",
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
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="hr">
      <body className="antialiased bg-zinc-50 relative">
        <Providers>
          <div className="min-h-screen flex flex-col w-full">
            {/* pattern background */}
            <div className="absolute inset-0 z-[-15] bg-[url('/+_pattern.png')] bg-repeat opacity-100" />
            {/* radial fade overlay to white */}
            <div className="absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#ffffff_90%)]" />
            {/* linear gradient from center to left and right */}
            <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.0)_70%,rgba(255,255,255,0.9)_100%)]" />

            <Header />

            <aside>
              <AppSidebar />
            </aside>

            <main className="max-w-5xl mx-auto p-4 mt-24 w-full">
              {children}
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
