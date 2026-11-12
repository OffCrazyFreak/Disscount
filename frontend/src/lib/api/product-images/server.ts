import "server-only";
import { cache } from "react";
import { BACKEND_ORIGIN } from "@/lib/api/backend-origin";
import {
  listedEansResponseSchema,
  productImagesResponseSchema,
} from "@/lib/api/types";

// A slow backend must not hold back the product page just for its share image.
const PHOTO_TIMEOUT_MS = 3_000;
const LISTED_EANS_TIMEOUT_MS = 15_000;

/** A user's unconfirmed upload must not represent the product outside our own gallery, where it carries a badge. */
export const getVerifiedMainPhotoUrl = cache(
  async (ean: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${BACKEND_ORIGIN}/api/products/${encodeURIComponent(ean)}/images`,
        { cache: "no-store", signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) },
      );
      if (!response.ok) return null;

      const { images } = productImagesResponseSchema.parse(
        await response.json(),
      );
      const mainPhoto = images[0];
      return mainPhoto?.status === "VERIFIED" ? mainPhoto.fullUrl : null;
    } catch {
      return null;
    }
  },
);

export async function getListedEans(): Promise<string[]> {
  const response = await fetch(`${BACKEND_ORIGIN}/api/products/catalog/eans`, {
    next: { revalidate: 60 * 60 },
    signal: AbortSignal.timeout(LISTED_EANS_TIMEOUT_MS),
  });

  // Throwing makes the sitemap answer 500, which crawlers retry, instead of an empty list.
  if (!response.ok) {
    throw new Error(`Listed EANs answered ${response.status}`);
  }

  return listedEansResponseSchema.parse(await response.json()).eans;
}
