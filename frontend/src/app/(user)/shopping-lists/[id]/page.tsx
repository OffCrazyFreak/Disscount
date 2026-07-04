import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ShoppingListDetailClient from "@/app/(user)/shopping-lists/[id]/components/shopping-list-detail-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.shoppingListDetail");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface IPageProps {
  params: { id: string };
}

export default async function ShoppingListDetailPage({ params }: IPageProps) {
  const urlParameters = await params;
  const listId = urlParameters?.id;

  return <ShoppingListDetailClient listId={listId} />;
}
