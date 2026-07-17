import { Metadata } from "next";
import ShoppingListDetailClient from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-client";

export const metadata: Metadata = {
  title: "Popis za kupnju - Detalji",
  description: "Pregled i upravljanje stavkama na popisu za kupnju.",
};

export default async function ShoppingListDetailPage(
  props: PageProps<"/shopping-lists/[id]">
) {
  const { id: listId } = await props.params;

  return <ShoppingListDetailClient listId={listId} />;
}
