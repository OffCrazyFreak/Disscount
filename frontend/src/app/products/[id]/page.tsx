import { Metadata } from "next";
import ProductDetailClient from "@/app/products/[id]/components/product-detail-client";

export const metadata: Metadata = {
  title: "Detalji proizvoda",
  description: "Usporedba cijena proizvoda.",
};

interface IPageProps {
  params: { id: string };
}

export default async function ProductDetailsPage({ params }: IPageProps) {
  const urlParameters = await params;
  const ean = urlParameters?.id;

  return <ProductDetailClient ean={ean} />;
}
