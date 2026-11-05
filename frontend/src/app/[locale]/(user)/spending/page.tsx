import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import SpendingClient from "@/app/[locale]/(user)/spending/components/spending-client";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("spending");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/spending", locale),
  };
}

export default function SpendingPage() {
  return <SpendingClient />;
}
