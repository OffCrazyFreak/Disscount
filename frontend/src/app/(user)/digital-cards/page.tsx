import { Metadata } from "next";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Moje digitalne kartice",
  description: "Pregled i upravljanje digitalnim karticama.",
};

export default async function DigitalCardsPage(
  props: PageProps<"/digital-cards">,
) {
  const query = readSearchParam(await props.searchParams);

  return <DigitalCardsClient query={query} />;
}
