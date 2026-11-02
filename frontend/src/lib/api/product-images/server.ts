import "server-only";
import { cache } from "react";
import { serverApiUrl } from "@/lib/env";
import {
  listedEansResponseSchema,
  productImagesResponseSchema,
} from "@/lib/api/types";

// A slow backend must not hold back the product page just for its share image.
const PHOTO_TIMEOUT_MS = 3_000;
const LISTED_EANS_TIMEOUT_MS = 15_000;

/** Full-size main photo of a product, or null when it has none or the backend is unreachable */
export const getMainPhotoUrl = cache(
  async (ean: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${serverApiUrl()}/api/products/${encodeURIComponent(ean)}/images`,
        { cache: "no-store", signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) },
      );
      if (!response.ok) return null;

      const { images } = productImagesResponseSchema.parse(
        await response.json(),
      );
      return images[0]?.fullUrl ?? null;
    } catch {
      return null;
    }
  },
);

/** EANs some chain priced in the latest weekly catalogue import */
export async function getListedEans(): Promise<string[]> {
  const response = await fetch(`${serverApiUrl()}/api/products/catalog/eans`, {
    next: { revalidate: 60 * 60 },
    signal: AbortSignal.timeout(LISTED_EANS_TIMEOUT_MS),
  });

  // Throwing makes the sitemap answer 500, which crawlers retry, instead of an empty list.
  if (!response.ok) {
    throw new Error(`Listed EANs answered ${response.status}`);
  }

  return listedEansResponseSchema.parse(await response.json()).eans;
}
