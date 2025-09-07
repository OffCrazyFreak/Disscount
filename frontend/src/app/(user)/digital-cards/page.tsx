import { Metadata } from "next";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";

export const metadata: Metadata = {
  title: "Moje digitalne kartice",
  description: "Pregled i upravljanje digitalnim karticama.",
};

interface Props {
  searchParams?: { q?: string | string[] };
}

export default async function DigitalCardsPage({ searchParams }: Props) {
  // normalize the `q` param on the server

  const query = await searchParams;
  const initialQuery = Array.isArray(searchParams?.q)
    ? searchParams.q[0]
    : searchParams?.q ?? "";

  return <DigitalCardsClient initialQuery={initialQuery} />;
}
