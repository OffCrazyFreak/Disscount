import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header/header";
import Footer from "@/components/footer";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Disscount - Najbolje cijene u Hrvatskoj",
  description:
    "App for shoppers in Croatia to compare store prices, create smart shopping lists, track loyalty cards, and get deal alerts with barcode scanning & AI suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 relative`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col w-full">
            {/* pattern background */}
            <div className="absolute inset-0 z-[-15] bg-[url('/+_pattern.png')] bg-repeat opacity-100" />
            {/* radial fade overlay to white */}
            <div className="absolute inset-0 -z-10 [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#ffffff_90%)]" />
            {/* linear gradient from center to left and right */}
            <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.0)_70%,rgba(255,255,255,0.9)_100%)]" />

            <Header />

            <AppSidebar />

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
