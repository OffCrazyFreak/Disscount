import { Metadata } from "next";

import SuggestionsClient from "@/app/suggestions/components/suggestions-client";

export const metadata: Metadata = {
  title: "Ideje i prijedlozi",
  description: "Predloži nove značajke i glasaj za one koje želiš vidjeti.",
};

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
