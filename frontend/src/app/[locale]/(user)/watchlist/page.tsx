import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import WatchlistClient from "@/app/[locale]/(user)/watchlist/components/watchlist-client";
import { readSearchParam } from "@/utils/generic";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("watchlist");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/watchlist", locale),
  };
}

export default async function WatchlistPage(
  props: PageProps<"/[locale]/watchlist">,
) {
  const query = readSearchParam(await props.searchParams);

  return <WatchlistClient query={query} />;
}
