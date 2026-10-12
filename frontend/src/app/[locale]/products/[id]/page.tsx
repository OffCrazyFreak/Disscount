import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageAlternates } from "@/i18n/alternates";
import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";

export async function generateMetadata(
  props: PageProps<"/[locale]/products/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const locale = await getLocale();
  const t = await getTranslations("productDetail");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates(`/products/${id}`, locale),
  };
}

export default async function ProductDetailsPage(
  props: PageProps<"/[locale]/products/[id]">,
) {
  const { id: ean } = await props.params;

  return <ProductDetailClient ean={ean} />;
}
