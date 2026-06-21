import { Metadata } from "next";

import MapClient from "@/app/map/components/map-client";

export const metadata: Metadata = {
  title: "Karta i radno vrijeme trgovina",
  description: "Pregled trgovina i njihovog radnog vremena na karti.",
};

interface IPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MapPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  return <MapClient query={query} />;
}
