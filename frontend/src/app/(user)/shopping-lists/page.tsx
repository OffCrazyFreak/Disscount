import { Metadata } from "next";
import ShoppingListsClient from "@/app/(user)/shopping-lists/components/shopping-lists-client";

export const metadata: Metadata = {
  title: "Popisi za kupnju",
  description: "Upravljanje popisima za kupnju.",
};

interface Props {
  searchParams?: { q?: string };
}

export default async function ShoppingListsPage({ searchParams }: Props) {
  const searchParameters = await searchParams;
  const rawQuery = searchParameters?.q ?? "";
  // Decode the URL parameter to get the original user input
  const query = rawQuery ? decodeURIComponent(rawQuery) : "";

  return <ShoppingListsClient query={query} />;
}
