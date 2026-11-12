import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates } from "@/i18n/alternates";
import ShoppingListDetailClient from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-detail-client";

export async function generateMetadata(
  props: PageProps<"/[locale]/shopping-lists/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const locale = await getLocale();
  const t = await getTranslations("shoppingListDetail");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates(`/shopping-lists/${id}`, locale),
  };
}

export default async function ShoppingListDetailPage(
  props: PageProps<"/[locale]/shopping-lists/[id]">,
) {
  const { id: listId } = await props.params;

  return <ShoppingListDetailClient listId={listId} />;
}
