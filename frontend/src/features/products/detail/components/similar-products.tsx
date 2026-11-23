import { Link } from "@/i18n/navigation";
import type { CategoryProduct } from "@/lib/api/types";
import { getCatalogNameLabel } from "@/utils/format/labels";
import { productPath } from "@/utils/links/product-links";

interface ISimilarProductsProps {
  heading: string;
  products: (CategoryProduct & { name: string })[];
}

export default function SimilarProducts({
  heading,
  products,
}: ISimilarProductsProps) {
  return (
    <section aria-labelledby="similar-products" className="space-y-3">
      <h2 id="similar-products" className="text-lg font-semibold">
        {heading}
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.ean}>
            <Link
              href={productPath(product.ean)}
              className="flex h-full flex-col gap-0.5 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Never clamped: names that differ only past the cut would look identical. */}
              <span lang="hr" className="font-medium">
                {getCatalogNameLabel(product.name)}
              </span>

              {product.brand && (
                <span lang="hr" className="text-sm text-muted-foreground">
                  {getCatalogNameLabel(product.brand)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
