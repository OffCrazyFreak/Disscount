import { Metadata } from "next";
import ProductDetailClient from "@/app/products/[id]/components/product-detail-client";

export const metadata: Metadata = {
  title: "Proizvod - Detalji",
  description: "Usporedba cijena proizvoda.",
};

interface Props {
  params: { id: string };
}

export default async function ProductDetailsPage({ params }: Props) {
  const ean = params.id;

  return <ProductDetailClient ean={ean} />;
}
