import { Metadata } from "next";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";

export const metadata: Metadata = {
  title: "Moje digitalne kartice",
  description: "Pregled i upravljanje digitalnim karticama.",
};

interface Props {
  searchParams?: { q?: string };
}

export default async function DigitalCardsPage({ searchParams }: Props) {
  const searchParameters = await searchParams;
  const rawQuery = searchParameters?.q ?? "";
  // Decode the URL parameter to get the original user input
  const query = rawQuery ? decodeURIComponent(rawQuery) : "";

  return <DigitalCardsClient query={query} />;
}
