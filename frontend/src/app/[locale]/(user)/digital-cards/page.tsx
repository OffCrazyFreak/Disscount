import { Suspense } from "react";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import DigitalCardsClient from "@/app/[locale]/(user)/digital-cards/components/digital-cards-client";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("digitalCards");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/digital-cards", locale),
  };
}

// Account-agnostic on purpose: the service worker precaches this page for everyone.
export default function DigitalCardsPage() {
  return (
    <Suspense fallback={null}>
      <DigitalCardsClient />
    </Suspense>
  );
}
