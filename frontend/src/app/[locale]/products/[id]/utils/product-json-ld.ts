import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { getMaxPrice, getMinPrice } from "@/utils/product-price-utils";

const DIGITS_ONLY = /^\d+$/;

interface IProductJsonLdInput {
  product: ProductResponse;
  url: string;
  image: string;
}

/**
 * Product snippet markup. AggregateOffer, not Offer: we list prices across chains and
 * sell nothing, which Google reserves merchant listings for. The numbers are the
 * page's own chain prices, as Google requires the markup to match what is visible.
 */
export function productJsonLd({ product, url, image }: IProductJsonLdInput) {
  const lowPrice = getMinPrice(product);
  const highPrice = getMaxPrice(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.ean,
    url,
    image,
    // "chain:code" ids are cijene's own keys for products without a barcode.
    ...(DIGITS_ONLY.test(product.ean) && { gtin: product.ean }),
    ...(product.brand && {
      brand: { "@type": "Brand", name: product.brand },
    }),
    ...(lowPrice !== null && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: lowPrice.toFixed(2),
        highPrice: (highPrice ?? lowPrice).toFixed(2),
        offerCount: product.chains.length,
      },
    }),
  };
}
