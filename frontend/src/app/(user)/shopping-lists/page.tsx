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
  const query = searchParameters?.q ?? "";

  return <ShoppingListsClient query={query} />;
}
