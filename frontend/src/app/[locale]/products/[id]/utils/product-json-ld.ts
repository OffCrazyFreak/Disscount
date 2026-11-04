import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { gs1CheckDigit } from "@/utils/barcode/check-digits";
import { getMaxPrice, getMinPrice } from "@/utils/product-price-utils";

const GTIN_SHAPE = /^(?:\d{8}|\d{12,14})$/;

// Mirrors the backend's Barcodes.isPublicGtin: prefix 2 marks in-store codes, not GTINs.
function isPublicGtin(ean: string): boolean {
  if (!GTIN_SHAPE.test(ean)) return false;
  if (ean.length === 13 && ean.startsWith("2")) return false;

  return gs1CheckDigit(ean.slice(0, -1)) === Number(ean.slice(-1));
}

interface IProductJsonLdInput {
  product: ProductResponse;
  url: string;
  image: string | null;
}

/** AggregateOffer, not Offer, because we sell nothing; the numbers are the page's own chain prices, as Google requires the markup to match. */
export function productJsonLd({ product, url, image }: IProductJsonLdInput) {
  const lowPrice = getMinPrice(product);
  const highPrice = getMaxPrice(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.ean,
    url,
    // Google wants images relevant to the page, so a product without a confirmed photo says nothing rather than show our logo.
    ...(image && { image }),
    // cijene also keys products by "chain:code" and by in-store codes, neither a GTIN.
    ...(isPublicGtin(product.ean) && { gtin: product.ean }),
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
