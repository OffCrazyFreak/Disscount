import { Metadata } from "next";
import WatchlistClient from "@/app/(user)/watchlist/components/watchlist-client";

export const metadata: Metadata = {
  title: "Popis za praćenje",
  description: "Prati cijene proizvoda i primi obavijesti o sniženjima.",
};

interface IPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WatchlistPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <WatchlistClient query={query} />;
}
