import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import DigitalCardsClient from "@/app/(user)/digital-cards/components/digital-cards-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.digitalCards");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function DigitalCardsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  return <DigitalCardsClient query={query} />;
}
