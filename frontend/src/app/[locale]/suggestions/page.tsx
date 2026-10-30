import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import SuggestionsClient from "@/app/[locale]/suggestions/components/suggestions-client";
import { pageAlternates } from "@/i18n/alternates";
import { readSearchParam } from "@/utils/generic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("suggestions");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/suggestions", locale),
  };
}

export default async function SuggestionsPage(
  props: PageProps<"/[locale]/suggestions">,
) {
  const query = readSearchParam(await props.searchParams);

  return <SuggestionsClient query={query} />;
}
