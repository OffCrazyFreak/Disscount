import { Metadata } from "next";
import ShoppingListsClient from "@/app/(user)/shopping-lists/components/shopping-lists-client";

export const metadata: Metadata = {
  title: "Popisi za kupnju",
  description: "Upravljanje popisima za kupnju.",
};

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ShoppingListsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <ShoppingListsClient query={query} />;
}
