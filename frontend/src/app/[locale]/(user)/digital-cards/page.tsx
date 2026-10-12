import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import DigitalCardsClient from "@/app/[locale]/(user)/digital-cards/components/digital-cards-client";
import { readSearchParam } from "@/utils/generic";
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

export default async function DigitalCardsPage(
  props: PageProps<"/[locale]/digital-cards">,
) {
  const query = readSearchParam(await props.searchParams);

  return <DigitalCardsClient query={query} />;
}
