import { Metadata } from "next";

import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Digitalne kartice",
  description:
    "Sve kartice vjernosti na jednom mjestu, dostupne i bez interneta.",
};

export default async function DigitalCardsPage(
  props: PageProps<"/digital-cards">,
) {
  const query = readSearchParam(await props.searchParams);

  return <DigitalCardsClient query={query} />;
}
