import apiClient from "@/lib/api/api-base";
import {
  adminPhotoQueuePageSchema,
  adminProductPhotosSchema,
  contributorPhotoCountsSchema,
  type AdminPhotoQueuePage,
  type AdminProductPhotos,
  type ContributorPhotoCount,
  type PhotoQueueFilter,
  type ProductImageCrop,
} from "@/lib/api/types";

const BASE = "/api/admin/product-images";
// The largest page the backend sends (spring.data.web.pageable.max-page-size).
const QUEUE_PAGE_SIZE = 100;

export async function getPhotoQueue(
  filter: PhotoQueueFilter,
  page: number,
): Promise<AdminPhotoQueuePage> {
  const response = await apiClient.get<unknown>(`${BASE}/queue`, {
    params: { filter, page, size: QUEUE_PAGE_SIZE },
  });
  return adminPhotoQueuePageSchema.parse(response.data);
}

export async function getAdminProductPhotos(
  ean: string,
): Promise<AdminProductPhotos> {
  const response = await apiClient.get<unknown>(`${BASE}/${ean}`);
  return adminProductPhotosSchema.parse(response.data);
}

export async function refreshFromOpenFoodFacts(
  ean: string,
): Promise<AdminProductPhotos> {
  const response = await apiClient.post<unknown>(`${BASE}/${ean}/refresh`);
  return adminProductPhotosSchema.parse(response.data);
}

export async function setMainPhoto(
  ean: string,
  imageId: string,
): Promise<AdminProductPhotos> {
  const response = await apiClient.put<unknown>(`${BASE}/${ean}/main`, {
    imageId,
  });
  return adminProductPhotosSchema.parse(response.data);
}

export async function setPhotoStatus(
  imageId: string,
  status: "VERIFIED" | "HIDDEN",
): Promise<AdminProductPhotos> {
  const response = await apiClient.put<unknown>(
    `${BASE}/images/${imageId}/status`,
    { status },
  );
  return adminProductPhotosSchema.parse(response.data);
}

export async function deletePhoto(
  imageId: string,
): Promise<AdminProductPhotos> {
  const response = await apiClient.delete<unknown>(`${BASE}/images/${imageId}`);
  return adminProductPhotosSchema.parse(response.data);
}

export async function getContributorPhotoCounts(): Promise<
  ContributorPhotoCount[]
> {
  const response = await apiClient.get<unknown>(`${BASE}/contributors`);
  return contributorPhotoCountsSchema.parse(response.data);
}

export async function cropPhoto(
  imageId: string,
  rotation: number,
  crop: ProductImageCrop | null,
): Promise<AdminProductPhotos> {
  const response = await apiClient.put<unknown>(
    `${BASE}/images/${imageId}/crop`,
    { rotation, crop },
  );
  return adminProductPhotosSchema.parse(response.data);
}

export async function markProductReviewed(
  ean: string,
): Promise<AdminProductPhotos> {
  const response = await apiClient.post<unknown>(`${BASE}/${ean}/reviewed`);
  return adminProductPhotosSchema.parse(response.data);
}

/** User originals sit behind the admin check, so an <img src> cannot load them. */
export async function fetchPrivateOriginal(path: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(path, { responseType: "blob" });
  return response.data;
}
