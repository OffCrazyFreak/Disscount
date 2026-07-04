import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductDetailClient from "@/app/products/[id]/components/product-detail-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.productDetail");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

interface IPageProps {
  params: { id: string };
}

export default async function ProductDetailsPage({ params }: IPageProps) {
  const urlParameters = await params;
  const ean = urlParameters?.id;

  return <ProductDetailClient ean={ean} />;
}
