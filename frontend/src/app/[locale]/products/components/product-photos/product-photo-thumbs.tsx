import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/api/types";

interface IProductPhotoThumbsProps {
  images: ProductImage[];
  shown: number;
  productName: string;
  onShow: (index: number) => void;
}

export default function ProductPhotoThumbs({
  images,
  shown,
  productName,
  onShow,
}: IProductPhotoThumbsProps) {
  const t = useTranslations("productPhotos");

  return (
    <ul className="flex gap-2 overflow-x-auto pb-1">
      {images.map((image, index) => (
        <li key={image.id} className="shrink-0">
          <button
            type="button"
            aria-label={t("photo.thumbnail", {
              index: index + 1,
              total: images.length,
            })}
            aria-current={index === shown ? "true" : undefined}
            onClick={() => onShow(index)}
            className={cn(
              "block rounded-lg ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              index === shown && "ring-2 ring-primary",
            )}
          >
            <PhotoTile
              src={image.thumbUrl}
              alt={t("photo.altNumbered", {
                name: productName,
                index: index + 1,
              })}
              className="size-14 rounded-lg"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
