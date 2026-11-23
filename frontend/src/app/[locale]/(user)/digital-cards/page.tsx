import { Suspense } from "react";
import { Metadata } from "next";
import DigitalCardsClient from "@/app/[locale]/(user)/digital-cards/components/digital-cards-client";
import { pageMetadata } from "@/i18n/alternates";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("digitalCards", "/digital-cards");
}

// Account-agnostic on purpose: the service worker precaches this page for everyone.
export default function DigitalCardsPage() {
  return (
    <Suspense fallback={null}>
      <DigitalCardsClient />
    </Suspense>
  );
}
