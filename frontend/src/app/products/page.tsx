import { Metadata } from "next";
import ProductsClient from "@/app/products/components/products-client";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

interface Props {
  searchParams?: { q?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const searchParameters = await searchParams;
  const rawQuery = searchParameters?.q ?? "";
  // Decode the URL parameter to get the original user input
  const query = rawQuery ? decodeURIComponent(rawQuery) : "";

  return <ProductsClient query={query} />;
}
