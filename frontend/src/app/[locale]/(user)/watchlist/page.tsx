import { Metadata } from "next";
import WatchlistClient from "@/app/[locale]/(user)/watchlist/components/watchlist-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Popis za praćenje",
  description: "Prati cijene proizvoda i primi obavijesti o popustima.",
};

export default async function WatchlistPage(props: PageProps<"/[locale]/watchlist">) {
  const query = readSearchParam(await props.searchParams);

  return <WatchlistClient query={query} />;
}
