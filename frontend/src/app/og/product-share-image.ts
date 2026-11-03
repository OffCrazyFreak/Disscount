import { createHash } from "node:crypto";

/**
 * Platforms and the CDN cache an image by its URL, so the file name follows the photo:
 * a new main photo gets a new URL, which is what makes the year-long cache safe.
 */
export function productShareImageFile(photoUrl: string): string {
  const version = createHash("sha256")
    .update(photoUrl)
    .digest("hex")
    .slice(0, 16);

  return `${version}.png`;
}

/** Ends in .png so the proxy skips it and Cloudflare caches it by extension. */
export function productShareImagePath(ean: string, photoUrl: string): string {
  return `/og/products/${ean}/${productShareImageFile(photoUrl)}`;
}
