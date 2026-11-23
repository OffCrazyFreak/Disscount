import type { IBreadcrumbStep } from "@/utils/breadcrumb-json-ld";
import { categoryPath } from "@/utils/category-links";
import { productPath } from "@/utils/product-links";

interface IProductBreadcrumbInput {
  ean: string;
  productName: string;
  homeLabel: string;
  productsLabel: string;
  /** Null when no category placed the product or the backend failed, which drops that step. */
  category: { slug: string; name: string } | null;
}

export function productBreadcrumbSteps({
  ean,
  productName,
  homeLabel,
  productsLabel,
  category,
}: IProductBreadcrumbInput): IBreadcrumbStep[] {
  return [
    { label: homeLabel, path: "/" },
    { label: productsLabel, path: "/products" },
    ...(category
      ? [{ label: category.name, path: categoryPath(category.slug) }]
      : []),
    { label: productName, path: productPath(ean) },
  ];
}
