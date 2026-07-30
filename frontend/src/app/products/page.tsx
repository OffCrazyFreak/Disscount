import { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "@/app/products/components/products-client";
import ProductsSkeleton from "@/app/products/components/products-skeleton";
import { readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Proizvodi",
  description: "Pregled dostupnih proizvoda.",
};

export default async function ProductsPage(props: PageProps<"/products">) {
  const query = readSearchParam(await props.searchParams);

  // ProductsClient's useSearchParams needs a Suspense boundary when prerendering.
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClient query={query} />
    </Suspense>
  );
}
