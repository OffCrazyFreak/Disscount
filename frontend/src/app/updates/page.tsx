import { Metadata } from "next";

import UpdatesClient from "@/app/updates/components/updates-client";

export const metadata: Metadata = {
  title: "Novosti",
  description: "Najnovije objave i novosti o Disscountu.",
};

interface IPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UpdatesPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  return <UpdatesClient query={query} />;
}
