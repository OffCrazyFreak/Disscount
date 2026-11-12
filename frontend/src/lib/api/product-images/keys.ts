import type { PhotoQueueFilter } from "@/lib/api/types";

export const PRODUCT_IMAGE_KEYS = {
  all: ["product-images"] as const,
  product: (ean: string) => ["product-images", "product", ean] as const,
  thumbnail: (ean: string) => ["product-images", "thumbnail", ean] as const,
  admin: ["admin", "product-images"] as const,
  adminProduct: (ean: string) =>
    ["admin", "product-images", "product", ean] as const,
  contributors: ["admin", "product-images", "contributors"] as const,
  queueAll: ["admin", "product-images", "queue"] as const,
  queue: (filter: PhotoQueueFilter) =>
    ["admin", "product-images", "queue", filter] as const,
};
