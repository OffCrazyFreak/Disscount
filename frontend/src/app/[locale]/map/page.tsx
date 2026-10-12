import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import MapClient from "@/app/[locale]/map/components/map-client";
import { readSearchParam } from "@/utils/generic";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("map");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/map", locale),
  };
}

export default async function MapPage(props: PageProps<"/[locale]/map">) {
  const query = readSearchParam(await props.searchParams);

  return <MapClient query={query} />;
}
