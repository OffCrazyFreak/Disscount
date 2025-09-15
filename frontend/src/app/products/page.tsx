import { Metadata } from "next";
import ProductsClient from "@/app/products/components/products-client";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

interface IPageProps {
  searchParams?: { q?: string };
}

export default async function ProductsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const rawQuery = searchParameters?.q ?? "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <ProductsClient query={query} />;
}
