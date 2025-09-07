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
  const query = (await searchParams?.q) ?? "";

  return <DigitalCardsClient query={query} />;
}
