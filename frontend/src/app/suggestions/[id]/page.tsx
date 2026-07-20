import { Metadata } from "next";
import { notFound } from "next/navigation";

import SuggestionDetailsClient from "@/app/suggestions/[id]/components/suggestion-details-client";
import { getSuggestionById } from "@/app/suggestions/suggestions";

export const metadata: Metadata = {
  title: "Ideje i prijedlozi - Detalji",
  description: "Detalji prijedloga i komentari zajednice.",
};

export default async function SuggestionDetailPage(
  props: PageProps<"/suggestions/[id]">,
) {
  const { id } = await props.params;
  const suggestion = getSuggestionById(id);

  if (!suggestion) {
    notFound();
  }

  return <SuggestionDetailsClient suggestion={suggestion} />;
}
