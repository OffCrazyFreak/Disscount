import { Metadata } from "next";
import { pageMetadata } from "@/i18n/alternates";
import ShoppingListDetailClient from "@/features/shopping-lists/detail/components/shopping-list-detail-client";

export async function generateMetadata(
  props: PageProps<"/[locale]/shopping-lists/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  return pageMetadata("shoppingListDetail", `/shopping-lists/${id}`);
}

export default async function ShoppingListDetailPage(
  props: PageProps<"/[locale]/shopping-lists/[id]">,
) {
  const { id: listId } = await props.params;

  return <ShoppingListDetailClient listId={listId} />;
}
