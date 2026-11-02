import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PRODUCT_IMAGE_KEYS } from "@/lib/api/product-images/keys";
import {
  getProductImages,
  reportProductImage,
  uploadProductImage,
} from "@/lib/api/product-images/queries";
import { loadThumbnail } from "@/lib/api/product-images/thumbnail-batcher";
import type { ProductImagesResponse } from "@/lib/api/types";

// Photos change rarely, and a fresh visit refetches anyway.
const PHOTO_STALE_MS = 5 * 60_000;

export function useProductImages(ean: string, { enabled = true } = {}) {
  return useQuery<ProductImagesResponse, Error>({
    queryKey: PRODUCT_IMAGE_KEYS.product(ean),
    queryFn: () => getProductImages(ean),
    staleTime: PHOTO_STALE_MS,
    enabled: enabled && Boolean(ean),
  });
}

export function useProductThumbnail(ean: string | undefined) {
  return useQuery<string | null, Error>({
    queryKey: PRODUCT_IMAGE_KEYS.thumbnail(ean ?? ""),
    queryFn: () => loadThumbnail(ean ?? ""),
    staleTime: PHOTO_STALE_MS,
    enabled: Boolean(ean),
    // A missing thumbnail is not worth retrying for every row of a list.
    retry: false,
  });
}

export function useUploadProductImage(ean: string) {
  const queryClient = useQueryClient();

  return useMutation<ProductImagesResponse, Error, Blob>({
    mutationFn: (photo) => uploadProductImage(ean, photo),
    onSuccess: (data) => {
      queryClient.setQueryData(PRODUCT_IMAGE_KEYS.product(ean), data);
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.thumbnail(ean),
      });
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.admin,
      });
    },
  });
}

export function useReportProductImage() {
  return useMutation<void, Error, string>({ mutationFn: reportProductImage });
}
