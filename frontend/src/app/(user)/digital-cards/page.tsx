import { Metadata } from "next";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";

export const metadata: Metadata = {
  title: "Moje digitalne kartice",
  description: "Pregled i upravljanje digitalnim karticama.",
};

interface ISearchParamsProps {
  searchParams?: { q?: string };
}

export default async function DigitalCardsPage({
  searchParams,
}: ISearchParamsProps) {
  const searchParameters = await searchParams;
  const rawQuery = searchParameters?.q ?? "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <DigitalCardsClient query={query} />;
}
