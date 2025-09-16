import { Metadata } from "next";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";

export const metadata: Metadata = {
  title: "Moje digitalne kartice",
  description: "Pregled i upravljanje digitalnim karticama.",
};

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function DigitalCardsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <DigitalCardsClient query={query} />;
}
