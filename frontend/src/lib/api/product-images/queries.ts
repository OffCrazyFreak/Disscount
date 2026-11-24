import apiClient from "@/lib/api/api-base";
import {
  productImagesResponseSchema,
  productThumbnailsResponseSchema,
  type ProductImagesResponse,
} from "@/lib/api/types";

export async function getProductImages(
  ean: string,
): Promise<ProductImagesResponse> {
  const response = await apiClient.get<unknown>(`/api/products/${ean}/images`);
  return productImagesResponseSchema.parse(response.data);
}

export async function getProductThumbnails(
  eans: string[],
): Promise<Record<string, string>> {
  const response = await apiClient.get<unknown>(
    "/api/products/images/thumbnails",
    { params: { eans: eans.join(",") } },
  );
  return productThumbnailsResponseSchema.parse(response.data).thumbnails;
}

export async function uploadProductImage(
  ean: string,
  photo: Blob,
): Promise<ProductImagesResponse> {
  const body = new FormData();
  body.append("photo", photo, `${ean}.jpg`);
  const response = await apiClient.post<unknown>(
    `/api/products/${ean}/images`,
    body,
    // Unset so the browser writes the multipart boundary itself.
    { headers: { "Content-Type": undefined } },
  );
  return productImagesResponseSchema.parse(response.data);
}

export async function reportProductImage(imageId: string): Promise<void> {
  await apiClient.post(`/api/products/images/${imageId}/report`);
}
