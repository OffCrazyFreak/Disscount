import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/app/[locale]/products/components/product-item/product-price";
import type { CategoryProduct } from "@/lib/api/types";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getCatalogNameLabel } from "@/utils/labels";

interface ICategoryProductListProps {
  items: CategoryProduct[];
  /** Live products by EAN, page 1 only; a product missing here shows without a price. */
  pricedProducts: Map<string, ProductResponse>;
}

export default function CategoryProductList({
  items,
  pricedProducts,
}: ICategoryProductListProps) {
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const product = pricedProducts.get(item.ean);

        return (
          <li key={item.ean}>
            <ProductCard
              ean={item.ean}
              name={
                product?.name ?? (item.name && getCatalogNameLabel(item.name))
              }
              brand={
                product?.brand ??
                (item.brand && getCatalogNameLabel(item.brand))
              }
              category={null}
              trailing={
                product && <ProductUnitPriceDetails product={product} />
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
