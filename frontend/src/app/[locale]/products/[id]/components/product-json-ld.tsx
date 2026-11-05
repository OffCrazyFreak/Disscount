import { productJsonLd } from "@/app/[locale]/products/[id]/utils/product-json-ld";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

interface IProductJsonLdProps {
  product: ProductResponse;
  url: string;
  image: string | null;
}

export default function ProductJsonLd({
  product,
  url,
  image,
}: IProductJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Product names come from upstream, so "<" is escaped to keep them inside the script.
        __html: JSON.stringify(productJsonLd({ product, url, image })).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
