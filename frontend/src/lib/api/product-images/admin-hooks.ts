import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { PRODUCT_IMAGE_KEYS } from "@/lib/api/product-images/keys";
import {
  cropPhoto,
  deletePhoto,
  getAdminProductPhotos,
  getContributorPhotoCounts,
  getPhotoQueue,
  markProductReviewed,
  refreshFromOpenFoodFacts,
  setMainPhoto,
  setPhotoStatus,
} from "@/lib/api/product-images/admin-queries";
import type {
  AdminProductPhotos,
  PhotoQueueFilter,
  ProductImageCrop,
} from "@/lib/api/types";

function photoQueueQueryOptions(filter: PhotoQueueFilter, page: number) {
  return queryOptions({
    queryKey: PRODUCT_IMAGE_KEYS.queue(filter, page),
    queryFn: () => getPhotoQueue(filter, page),
    placeholderData: keepPreviousData,
  });
}

function adminProductPhotosQueryOptions(ean: string) {
  return queryOptions({
    queryKey: PRODUCT_IMAGE_KEYS.adminProduct(ean),
    queryFn: () => getAdminProductPhotos(ean),
  });
}

export function usePhotoQueue(filter: PhotoQueueFilter, page: number) {
  return useQuery(photoQueueQueryOptions(filter, page));
}

export function useAdminProductPhotos(ean: string, { enabled = true } = {}) {
  return useQuery({
    ...adminProductPhotosQueryOptions(ean),
    enabled: enabled && Boolean(ean),
  });
}

/** Every admin change returns the product's new state, which also changes what users see. */
function usePhotoChange<TVariables>(
  ean: string,
  mutationFn: (variables: TVariables) => Promise<AdminProductPhotos>,
) {
  const queryClient = useQueryClient();

  return useMutation<AdminProductPhotos, Error, TVariables>({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(PRODUCT_IMAGE_KEYS.adminProduct(ean), data);
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.product(ean),
      });
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.thumbnail(ean),
      });
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.queueAll,
      });
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.contributors,
      });
    },
  });
}

export function useRefreshFromOpenFoodFacts(ean: string) {
  return usePhotoChange<void>(ean, () => refreshFromOpenFoodFacts(ean));
}

export function useSetMainPhoto(ean: string) {
  return usePhotoChange<string>(ean, (imageId) => setMainPhoto(ean, imageId));
}

export function useSetPhotoStatus(ean: string) {
  return usePhotoChange<{ imageId: string; status: "VERIFIED" | "HIDDEN" }>(
    ean,
    ({ imageId, status }) => setPhotoStatus(imageId, status),
  );
}

export function useDeletePhoto(ean: string) {
  return usePhotoChange<string>(ean, deletePhoto);
}

/** Uploaded and deleted photo counts per user, for the admin users list. */
export function useContributorPhotoCounts() {
  return useQuery({
    queryKey: PRODUCT_IMAGE_KEYS.contributors,
    queryFn: getContributorPhotoCounts,
  });
}

export function useCropPhoto(ean: string) {
  return usePhotoChange<{
    imageId: string;
    rotation: number;
    crop: ProductImageCrop | null;
  }>(ean, ({ imageId, rotation, crop }) => cropPhoto(imageId, rotation, crop));
}

export function useMarkProductReviewed(ean: string) {
  return usePhotoChange<void>(ean, () => markProductReviewed(ean));
}
