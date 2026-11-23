import ProductCard from "@/components/custom/product/product-card";
import ProductUnitPriceDetails from "@/features/products/components/product-item/product-price";
import type { CategoryProduct } from "@/lib/api/types";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getCatalogNameLabel } from "@/utils/format/labels";

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
        // A priced name can come in capitals too, and one list should read the same throughout.
        const name = product?.name ?? item.name;
        const brand = product?.brand ?? item.brand;

        return (
          <li key={item.ean}>
            <ProductCard
              ean={item.ean}
              name={name && getCatalogNameLabel(name)}
              brand={brand && getCatalogNameLabel(brand)}
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
