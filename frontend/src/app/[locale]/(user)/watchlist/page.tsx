import { Metadata } from "next";
import WatchlistClient from "@/features/watchlist/components/watchlist-client";
import { readSearchParam } from "@/utils/generic";
import { pageMetadata } from "@/i18n/alternates";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("watchlist", "/watchlist");
}

export default async function WatchlistPage(
  props: PageProps<"/[locale]/watchlist">,
) {
  const query = readSearchParam(await props.searchParams);

  return <WatchlistClient query={query} />;
}
