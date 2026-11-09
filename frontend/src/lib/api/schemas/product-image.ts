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

export const productImageSchema = z.object({
  id: z.string(),
  fullUrl: z.string(),
  // Null while a photo waits for its re-render; those files are 1080 px squares.
  fullWidth: z.number().int().nullable(),
  fullHeight: z.number().int().nullable(),
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
  reportCount: z.number().int(),
  createdAt: z.string(),
});

const adminProductFactsSchema = z.object({
  ean: z.string(),
  name: z.string().nullable(),
  brand: z.string().nullable(),
  storeListings: z.number().int(),
  chainCount: z.number().int(),
});

export const adminProductPhotosSchema = adminProductFactsSchema.extend({
  pinned: z.boolean(),
  reviewedAt: z.string().nullable(),
  images: z.array(adminProductImageSchema),
});

export const adminPhotoQueueItemSchema = adminProductFactsSchema.extend({
  previewUrl: z.string().nullable(),
  pendingCount: z.number().int(),
  reportedCount: z.number().int(),
  reviewedAt: z.string().nullable(),
});

export const adminPhotoQueuePageSchema = z.object({
  items: z.array(adminPhotoQueueItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
  reviewedCount: z.number().int(),
});

export const contributorPhotoCountSchema = z.object({
  userId: z.string(),
  uploaded: z.number().int(),
  deleted: z.number().int(),
});

export const contributorPhotoCountsSchema = z.array(
  contributorPhotoCountSchema,
);

export const photoQueueFilterSchema = z.enum(["todo", "pending", "reported"]);

export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductImagesResponse = z.infer<typeof productImagesResponseSchema>;
export type ProductImageCrop = z.infer<typeof productImageCropSchema>;
export type AdminProductImage = z.infer<typeof adminProductImageSchema>;
export type AdminProductPhotos = z.infer<typeof adminProductPhotosSchema>;
export type AdminPhotoQueueItem = z.infer<typeof adminPhotoQueueItemSchema>;
export type AdminPhotoQueuePage = z.infer<typeof adminPhotoQueuePageSchema>;
export type ContributorPhotoCount = z.infer<typeof contributorPhotoCountSchema>;
export type PhotoQueueFilter = z.infer<typeof photoQueueFilterSchema>;
