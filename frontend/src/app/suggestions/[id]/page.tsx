import { Metadata } from "next";
import { notFound } from "next/navigation";

import SuggestionDetailsClient from "@/app/suggestions/[id]/components/suggestion-details-client";
import { getSuggestionById } from "@/app/suggestions/suggestions";

export const metadata: Metadata = {
  title: "Ideje i prijedlozi - Detalji",
  description: "Detalji prijedloga i komentari zajednice.",
};

interface IPageProps {
  params: Promise<{ id: string }>;
}

export default async function SuggestionDetailPage({ params }: IPageProps) {
  const { id } = await params;
  const suggestion = getSuggestionById(id);

  if (!suggestion) {
    notFound();
  }

  return <SuggestionDetailsClient suggestion={suggestion} />;
}
