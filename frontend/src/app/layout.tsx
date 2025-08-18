import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "../lib/ReactQueryProvider";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import Header from "@/components/header";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <SidebarProvider>
            <Header />

            <AppSidebar />

            <main>{children}</main>
          </SidebarProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
