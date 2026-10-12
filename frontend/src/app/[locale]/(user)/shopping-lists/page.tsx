import { Metadata } from "next";
import ShoppingListsClient from "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-client";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Popisi za kupnju",
  description: "Upravljanje popisima za kupnju.",
};

export default async function ShoppingListsPage(
  props: PageProps<"/[locale]/shopping-lists">,
) {
  const query = readSearchParam(await props.searchParams);

  return <ShoppingListsClient query={query} />;
}
