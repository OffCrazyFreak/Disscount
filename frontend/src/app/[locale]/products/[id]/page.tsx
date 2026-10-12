import { Metadata } from "next";
import ProductDetailClient from "@/app/[locale]/products/[id]/components/product-detail-client";

export const metadata: Metadata = {
  title: "Detalji proizvoda",
  description: "Usporedba cijena proizvoda.",
};

export default async function ProductDetailsPage(
  props: PageProps<"/[locale]/products/[id]">,
) {
  const { id: ean } = await props.params;

  return <ProductDetailClient ean={ean} />;
}
