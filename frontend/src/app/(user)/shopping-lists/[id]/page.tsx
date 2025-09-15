import { Metadata } from "next";
import ShoppingListDetailClient from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-client";

export const metadata: Metadata = {
  title: "Popis za kupnju - Detalji",
  description: "Pregled i upravljanje stavkama na popisu za kupnju.",
};

interface IPageProps {
  params: { id: string };
}

export default async function ShoppingListDetailPage({ params }: IPageProps) {
  const urlParameters = await params;
  const listId = urlParameters?.id;

  return <ShoppingListDetailClient listId={listId} />;
}
