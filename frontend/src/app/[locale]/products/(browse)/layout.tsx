import type { ReactNode } from "react";

import ProductsLandingLinks from "@/app/[locale]/products/(browse)/components/products-landing-links";

interface IProductsBrowseLayoutProps {
  children: ReactNode;
}

/** Outside loading.tsx's Suspense boundary, so the crawlable links sit in <main> of the first HTML. */
export default function ProductsBrowseLayout({
  children,
}: IProductsBrowseLayoutProps) {
  return (
    <>
      {children}

      <ProductsLandingLinks />
    </>
  );
}
