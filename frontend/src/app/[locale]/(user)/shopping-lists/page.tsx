import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import ShoppingListsClient from "@/app/[locale]/(user)/shopping-lists/components/shopping-lists-client";
import { readSearchParam } from "@/utils/generic";
import { pageAlternates } from "@/i18n/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("shoppingLists");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/shopping-lists", locale),
  };
}

export default async function ShoppingListsPage(
  props: PageProps<"/[locale]/shopping-lists">,
) {
  const query = readSearchParam(await props.searchParams);

  return <ShoppingListsClient query={query} />;
}
