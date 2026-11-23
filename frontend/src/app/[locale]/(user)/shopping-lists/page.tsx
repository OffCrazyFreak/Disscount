import { Metadata } from "next";
import ShoppingListsClient from "@/features/shopping-lists/components/shopping-lists-client";
import { readSearchParam } from "@/utils/generic";
import { pageMetadata } from "@/i18n/alternates";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("shoppingLists", "/shopping-lists");
}

export default async function ShoppingListsPage(
  props: PageProps<"/[locale]/shopping-lists">,
) {
  const query = readSearchParam(await props.searchParams);

  return <ShoppingListsClient query={query} />;
}
