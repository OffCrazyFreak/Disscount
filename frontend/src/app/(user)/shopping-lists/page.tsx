import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ShoppingListsClient from "@/app/(user)/shopping-lists/components/shopping-lists-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.shoppingLists");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ShoppingListsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  let query = rawQuery;

  try {
    query = decodeURIComponent(rawQuery) || rawQuery;
  } catch {
    query = rawQuery;
  }

  return <ShoppingListsClient query={query} />;
}
