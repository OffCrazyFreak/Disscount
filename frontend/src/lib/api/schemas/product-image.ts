import { z } from "zod";

export const productImageSourceSchema = z.enum([
  "OPEN_FOOD_FACTS",
  "USER",
  "ADMIN",
]);
export const productImageStatusSchema = z.enum([
  "CANDIDATE",
  "PENDING",
  "VERIFIED",
  "HIDDEN",
]);

/** A photo as everyone sees it; the first of a product's list is its main photo. */
export const productImageSchema = z.object({
  id: z.string(),
  fullUrl: z.string(),
  thumbUrl: z.string(),
  smallUrl: z.string(),
  source: productImageSourceSchema,
  status: productImageStatusSchema,
});

export const productImagesResponseSchema = z.object({
  ean: z.string(),
  images: z.array(productImageSchema),
});

export const productThumbnailsResponseSchema = z.object({
  thumbnails: z.record(z.string(), z.string()),
});

export const listedEansResponseSchema = z.object({
  eans: z.array(z.string()),
});

export const productImageCropSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
});

export const adminProductImageSchema = z.object({
  id: z.string(),
  source: productImageSourceSchema,
  status: productImageStatusSchema,
  lang: z.string().nullable(),
  previewUrl: z.string().nullable(),
  fullUrl: z.string().nullable(),
  originalUrl: z.string(),
  rendered: z.boolean(),
  main: z.boolean(),
  rotation: z.number().int(),
  crop: productImageCropSchema.nullable(),
  originalWidth: z.number().int().nullable(),
  originalHeight: z.number().int().nullable(),
  reportCount: z.number().int(),
  createdAt: z.string(),
});

// What the admin sees about a product in the queue and in the editor.
const adminProductFactsSchema = z.object({
  ean: z.string(),
  name: z.string().nullable(),
  brand: z.string().nullable(),
  storeListings: z.number().int(),
  chainCount: z.number().int(),
});

export const adminProductPhotosSchema = adminProductFactsSchema.extend({
  mainImageId: z.string().nullable(),
  pinned: z.boolean(),
  needsReview: z.boolean(),
  reviewedAt: z.string().nullable(),
  offDetailsFetchedAt: z.string().nullable(),
  images: z.array(adminProductImageSchema),
});

export const adminPhotoQueueItemSchema = adminProductFactsSchema.extend({
  previewUrl: z.string().nullable(),
  imageCount: z.number().int(),
  pendingCount: z.number().int(),
  reportedCount: z.number().int(),
  needsReview: z.boolean(),
  reviewedAt: z.string().nullable(),
});

export const adminPhotoQueuePageSchema = z.object({
  items: z.array(adminPhotoQueueItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
  reviewedCount: z.number().int(),
});

export const photoQueueFilterSchema = z.enum(["todo", "pending", "reported"]);

export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductImagesResponse = z.infer<typeof productImagesResponseSchema>;
export type ProductImageCrop = z.infer<typeof productImageCropSchema>;
export type AdminProductImage = z.infer<typeof adminProductImageSchema>;
export type AdminProductPhotos = z.infer<typeof adminProductPhotosSchema>;
export type AdminPhotoQueueItem = z.infer<typeof adminPhotoQueueItemSchema>;
export type AdminPhotoQueuePage = z.infer<typeof adminPhotoQueuePageSchema>;
export type PhotoQueueFilter = z.infer<typeof photoQueueFilterSchema>;
