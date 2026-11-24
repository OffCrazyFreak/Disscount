import { productJsonLd } from "@/features/products/detail/utils/product-json-ld";
import JsonLdScript from "@/components/custom/common/shell/json-ld-script";
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
  return <JsonLdScript data={productJsonLd({ product, url, image })} />;
}
