import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SuggestionsClient from "@/app/suggestions/components/suggestions-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.suggestions");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface IPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SuggestionsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  return <SuggestionsClient query={query} />;
}
