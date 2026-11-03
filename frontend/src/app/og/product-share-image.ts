import { createHash } from "node:crypto";

// Raise it when the card's design changes, or Cloudflare keeps the old card for a year.
const CARD_DESIGN_VERSION = 2;

export const PRODUCT_CARD_CONTENT_TYPE = "image/jpeg";

/**
 * Platforms and the CDN cache an image by its URL, so the file name follows the photo:
 * a new main photo gets a new URL, which is what makes the year-long cache safe.
 */
export function productShareImageFile(photoUrl: string): string {
  const version = createHash("sha256")
    .update(`${CARD_DESIGN_VERSION}:${photoUrl}`)
    .digest("hex")
    .slice(0, 16);

  return `${version}.jpg`;
}

/** Ends in .jpg so the proxy skips it and Cloudflare caches it by extension. */
export function productShareImagePath(ean: string, photoUrl: string): string {
  return `/og/products/${ean}/${productShareImageFile(photoUrl)}`;
}
