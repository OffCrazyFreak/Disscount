import type { ProductResponse } from "@/lib/cijene-api/schemas";
import { gs1CheckDigit } from "@/utils/barcode/check-digits";
import { getChainLabel } from "@/utils/labels";
import {
  getMaxPrice,
  getMinPrice,
  getNewestPriceDate,
  parsePrice,
} from "@/utils/product-price-utils";

const GTIN_SHAPE = /^(?:\d{8}|\d{12,14})$/;

// Mirrors the backend's Barcodes.isPublicGtin: prefix 2 marks in-store codes, not GTINs.
function isPublicGtin(ean: string): boolean {
  if (!GTIN_SHAPE.test(ean)) return false;
  if (ean.length === 13 && ean.startsWith("2")) return false;

  return gs1CheckDigit(ean.slice(0, -1)) === Number(ean.slice(-1));
}

/** Each chain's lowest price, the "Najniža" its row on the page shows. */
function chainOffers(product: ProductResponse) {
  return product.chains.flatMap((chain) => {
    const price = parsePrice(chain.min_price);
    if (price === null) return [];

    return [
      {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency: "EUR",
        seller: { "@type": "Organization", name: getChainLabel(chain.chain) },
      },
    ];
  });
}

interface IProductJsonLdInput {
  product: ProductResponse;
  url: string;
  image: string | null;
}

/** AggregateOffer because we sell nothing; the numbers match the page, as Google requires. */
export function productJsonLd({ product, url, image }: IProductJsonLdInput) {
  const lowPrice = getMinPrice(product);
  const highPrice = getMaxPrice(product);
  const priceDate = getNewestPriceDate(product);
  const offers = chainOffers(product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.ean,
    url,
    // Google wants relevant images, so a product with no confirmed photo says nothing, not our logo.
    ...(image && { image }),
    // cijene also keys products by "chain:code" and by in-store codes, neither a GTIN.
    ...(isPublicGtin(product.ean) && { gtin: product.ean }),
    // Bing reads this as the page's freshness; Google ignores it on a Product.
    ...(priceDate && { dateModified: priceDate }),
    ...(product.brand && {
      brand: { "@type": "Brand", name: product.brand },
    }),
    ...(lowPrice !== null && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: lowPrice.toFixed(2),
        highPrice: (highPrice ?? lowPrice).toFixed(2),
        // Counts the offers listed, since a chain with an unreadable price is left out of them.
        offerCount: offers.length,
        offers,
      },
    }),
  };
}
