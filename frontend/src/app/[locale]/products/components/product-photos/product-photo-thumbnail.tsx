"use client";

import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { useProductThumbnail } from "@/lib/api/product-images/hooks";

interface IProductPhotoThumbnailProps {
  ean: string;
  name: string;
}

export default function ProductPhotoThumbnail({
  ean,
  name,
}: IProductPhotoThumbnailProps) {
  const t = useTranslations("productPhotos");
  const { data: url } = useProductThumbnail(ean);

  if (!url) return null;
  return (
    <PhotoTile
      src={url}
      alt={t("photo.alt", { name })}
      className="hidden size-16 shrink-0 rounded-lg sm:block"
    />
  );
}
