import { Metadata } from "next";
import ProductsClient from "@/app/products/components/products-client";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

interface IPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({ searchParams }: IPageProps) {
  const searchParameters = await searchParams;
  const qParam = searchParameters?.q;
  const rawQuery = (Array.isArray(qParam) ? qParam[0] : qParam) || "";
  const query = decodeURIComponent(rawQuery) || rawQuery;

  return <ProductsClient query={query} />;
}
