import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import SuggestionDetailsClient from "@/app/suggestions/[id]/components/suggestion-details-client";
import { getSuggestionById } from "@/app/suggestions/suggestions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.suggestionDetail");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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
