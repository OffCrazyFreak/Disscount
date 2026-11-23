import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";

import PhotoTile from "@/components/custom/product-photos/photo-tile";
import { Button } from "@/components/ui/button";
import { type ProductImage } from "@/lib/api/schemas/product-image";
import { cn } from "@/lib/utils";

// The main photo plus these two tiles; anything beyond is counted on the last tile.
const TILES = 2;

interface IProductPhotoStripProps {
  images: ProductImage[];
  onOpen: (index: number) => void;
  onAdd: () => void;
  className?: string;
}

/** With only the main photo there is nothing to show, so the add button lives in the viewer then. */
export default function ProductPhotoStrip({
  images,
  onOpen,
  onAdd,
  className,
}: IProductPhotoStripProps) {
  const t = useTranslations("productPhotos");
  if (images.length < 2) return null;

  const tiles = images.slice(1, 1 + TILES);
  const hidden = images.length - 1 - TILES;

  return (
    // Three equal rows, so three slots fill exactly the main photo's height and fewer sit at the top.
    <div className={cn("grid-rows-3 gap-2.5", className)}>
      {tiles.map((image, offset) => {
        const index = offset + 1;
        const countsTheRest = hidden > 0 && offset === TILES - 1;

        return (
          <button
            key={image.id}
            type="button"
            aria-label={t("photo.thumbnail", {
              index: index + 1,
              total: images.length,
            })}
            onClick={() => onOpen(index)}
            className="relative block aspect-square h-full cursor-zoom-in rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <PhotoTile
              src={image.smallUrl}
              alt=""
              className="size-full rounded-md"
            />
            {countsTheRest && (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-xs font-medium text-white tabular-nums"
              >
                +{hidden + 1}
              </span>
            )}
          </button>
        );
      })}

      <Button
        variant="primary"
        size="icon"
        className="aspect-square size-auto h-full"
        aria-label={t("photo.add")}
        title={t("photo.add")}
        onClick={onAdd}
      >
        <ImagePlus aria-hidden="true" />
      </Button>
    </div>
  );
}
